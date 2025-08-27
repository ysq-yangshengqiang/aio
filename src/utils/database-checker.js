/**
 * 数据库表结构检查工具
 */
import { supabase } from '../lib/supabase.js'

export class DatabaseChecker {
  /**
   * 检查OKR表是否存在及其结构
   */
  static async checkOKRTable() {
    try {
      console.log('开始检查OKR表...')
      
      // 第一步：检查表是否存在（只查询id字段）
      const { data: basicCheck, error: basicError } = await supabase
        .from('okrs')
        .select('id')
        .limit(1)

      if (basicError) {
        // 如果表不存在
        if (basicError.code === 'PGRST106' || basicError.message.includes('does not exist')) {
          console.log('OKR表不存在')
          return { 
            exists: false, 
            error: 'OKR表不存在。需要创建表结构。',
            code: basicError.code
          }
        }

        // 如果是权限问题
        if (basicError.code === 'PGRST301' || basicError.message.includes('permission denied')) {
          return { 
            exists: true, 
            accessible: false,
            error: 'OKR表存在但无法访问，请检查RLS策略。',
            code: basicError.code
          }
        }

        // 如果是字段不存在（表结构问题）
        if (basicError.message.includes('column') && basicError.message.includes('does not exist')) {
          console.log('OKR表存在但结构不完整:', basicError.message)
          return {
            exists: true,
            accessible: true,
            hasRequiredFields: false,
            structureError: basicError.message,
            error: 'OKR表存在但结构不完整，缺少必要字段。'
          }
        }

        // 其他未知错误
        console.error('检查OKR表时出现未知错误:', basicError)
        return { 
          exists: false, 
          error: `检查OKR表时出错: ${basicError.message}`,
          code: basicError.code
        }
      }

      // 第二步：如果基本检查通过，测试核心字段
      console.log('OKR表基本存在，检查核心字段...')
      const { data: fieldCheck, error: fieldError } = await supabase
        .from('okrs')
        .select('id, title, user_id, status, progress')
        .limit(1)

      if (fieldError) {
        console.log('OKR表缺少核心字段:', fieldError.message)
        return {
          exists: true,
          accessible: true,
          hasRequiredFields: false,
          structureError: fieldError.message,
          error: 'OKR表缺少核心字段（title, user_id, status, progress）'
        }
      }

      // 第三步：检查可选字段
      console.log('检查OKR表的可选字段...')
      const { data: fullCheck, error: fullError } = await supabase
        .from('okrs')
        .select('id, title, user_id, status, progress, description, category, priority, start_date, target_date, created_at, updated_at')
        .limit(1)

      if (fullError) {
        console.log('OKR表缺少部分可选字段:', fullError.message)
        return {
          exists: true,
          accessible: true,
          hasRequiredFields: true,
          hasAllFields: false,
          structureError: fullError.message,
          error: 'OKR表缺少部分可选字段（category, priority等）',
          partialStructure: true
        }
      }

      // 所有检查通过
      console.log('OKR表结构检查完成，结构完整')
      return {
        exists: true,
        accessible: true,
        hasRequiredFields: true,
        hasAllFields: true,
        sampleRecord: fullCheck?.[0] || null
      }

    } catch (error) {
      console.error('OKR表检查失败:', error)
      return { 
        exists: false, 
        error: `检查失败: ${error.message}` 
      }
    }
  }

  /**
   * 检查关键结果表是否存在及其结构
   */
  static async checkKeyResultsTable() {
    try {
      // 直接尝试访问key_results表
      const { data: testData, error: accessError } = await supabase
        .from('key_results')
        .select('id')
        .limit(1)

      if (!accessError) {
        console.log('Key results table exists and is accessible')
        
        // 尝试获取完整字段来检查结构
        const { data: sampleData, error: structureError } = await supabase
          .from('key_results')
          .select('id, okr_id, title, description, target_value, current_value, unit, status, created_at, updated_at')
          .limit(1)

        if (!structureError) {
          console.log('Key results table structure appears complete')
          return { 
            exists: true, 
            accessible: true, 
            hasRequiredFields: true,
            sampleRecord: sampleData?.[0] || null
          }
        } else {
          return { 
            exists: true, 
            accessible: true, 
            hasRequiredFields: false,
            structureError: structureError.message
          }
        }
      }

      // 检查错误类型
      if (accessError.code === 'PGRST106' || accessError.message.includes('does not exist')) {
        return { 
          exists: false, 
          error: 'Key results表不存在。请在Supabase中执行数据库迁移脚本。' 
        }
      }

      if (accessError.code === 'PGRST301' || accessError.message.includes('permission denied')) {
        return { 
          exists: true, 
          accessible: false,
          error: 'Key results表存在但无法访问。请检查行级安全策略设置。'
        }
      }

      return { 
        exists: false, 
        error: `检查Key results表时出错: ${accessError.message}` 
      }

    } catch (error) {
      console.error('Key results table check failed:', error)
      return { exists: false, error: error.message }
    }
  }

  /**
   * 简单的数据库连接测试
   */
  static async testConnection() {
    try {
      // 使用 information_schema 来测试连接，这是安全的
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1)

      if (error) {
        console.error('Database connection test failed:', error)
        return { connected: false, error: error.message }
      }

      console.log('Database connection successful')
      return { connected: true }
    } catch (error) {
      console.error('Database connection test failed:', error)
      return { connected: false, error: error.message }
    }
  }

  /**
   * 创建简化的OKR表（紧急修复）
   */
  static async createSimpleOKRTable() {
    try {
      // 注意：这个方法需要数据库管理员权限
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.okrs_simple (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          progress INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE public.okrs_simple ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage their own OKRs" ON public.okrs_simple
          FOR ALL USING (auth.uid()::text = user_id::text);
      `

      // 这需要通过Supabase Dashboard执行
      console.log('Please execute this SQL in Supabase Dashboard:', createTableSQL)
      
      return { success: false, sql: createTableSQL }
    } catch (error) {
      console.error('Failed to create simple OKR table:', error)
      return { success: false, error: error.message }
    }
  }
}

export default DatabaseChecker