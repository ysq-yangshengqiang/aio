# Supabase 数据库迁移指南

## 问题描述
API 查询返回错误：`column key_results_1.progress does not exist`

## 解决方案
执行数据库迁移添加缺失的 `progress` 列。

## 执行步骤

### 1. 登录 Supabase Dashboard
- 访问：https://supabase.com/dashboard
- 选择项目：loshwjvlhpohvdsxcjgi

### 2. 打开 SQL Editor
- 点击左侧菜单 "SQL Editor"
- 点击 "New query"

### 3. 执行迁移脚本
复制以下 SQL 并执行：

```sql
-- 为 key_results 表添加 progress 列
ALTER TABLE public.key_results 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- 为现有记录计算进度值
UPDATE public.key_results 
SET progress = CASE 
    WHEN target_value IS NOT NULL AND target_value > 0 
    THEN LEAST(ROUND((current_value / target_value) * 100), 100)
    ELSE 0 
END
WHERE progress IS NULL OR progress = 0;

-- 添加注释
COMMENT ON COLUMN public.key_results.progress IS '关键结果完成进度百分比 (0-100)';

-- 创建自动更新进度的触发器函数
CREATE OR REPLACE FUNCTION update_key_result_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (OLD.current_value != NEW.current_value OR OLD.target_value != NEW.target_value)) 
       OR TG_OP = 'INSERT' THEN
        
        IF NEW.target_value IS NOT NULL AND NEW.target_value > 0 THEN
            NEW.progress = LEAST(ROUND((NEW.current_value / NEW.target_value) * 100), 100);
        ELSE
            NEW.progress = 0;
        END IF;
        
        IF NEW.progress >= 100 THEN
            NEW.status = 'completed';
        ELSIF NEW.progress > 0 AND NEW.status = 'active' THEN
            NEW.status = 'in_progress';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_key_result_progress ON public.key_results;
CREATE TRIGGER trigger_update_key_result_progress
    BEFORE INSERT OR UPDATE ON public.key_results
    FOR EACH ROW EXECUTE FUNCTION update_key_result_progress();
```

### 4. 验证迁移结果
执行以下查询验证：

```sql
-- 检查 progress 列是否存在
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'key_results' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 测试 API 查询
SELECT id, title, description, category, priority, status, progress, target_date,
       key_results.id as kr_id, key_results.title as kr_title, 
       key_results.status as kr_status, key_results.progress as kr_progress,
       key_results.target_value, key_results.current_value, key_results.unit
FROM okrs 
LEFT JOIN key_results ON okrs.id = key_results.okr_id
WHERE user_id = 'a91a2761-8637-49d0-9aa5-5a1ab2c953b6'
AND status IN ('active', 'in_progress')
ORDER BY priority DESC
LIMIT 5;
```

## 迁移完成后的功能

✅ **自动进度计算**：根据 `current_value` 和 `target_value` 自动计算进度  
✅ **状态自动更新**：进度达到 100% 时自动设置为 "completed"  
✅ **API 兼容性**：修复原始 API 查询错误  
✅ **数据完整性**：添加约束确保进度值在 0-100 范围内

## 原始 API 查询测试

迁移完成后，以下查询应该正常工作：

```
https://loshwjvlhpohvdsxcjgi.supabase.co/rest/v1/okrs?select=id%2Ctitle%2Cdescription%2Ccategory%2Cpriority%2Cstatus%2Cprogress%2Ctarget_date%2Ckey_results%28id%2Ctitle%2Cstatus%2Cprogress%2Ctarget_value%2Ccurrent_value%2Cunit%29&user_id=eq.a91a2761-8637-49d0-9aa5-5a1ab2c953b6&status=in.%28active%2Cin_progress%29&order=priority.desc&limit=5
```

## 故障排除

如果迁移失败：

1. **权限问题**：确保你有数据库管理权限
2. **语法错误**：检查 SQL 语法是否正确
3. **数据冲突**：如果有现有数据冲突，先备份数据
4. **回滚方案**：如需回滚，执行 `ALTER TABLE public.key_results DROP COLUMN IF EXISTS progress;`

## 联系支持

如果遇到问题，请：
1. 检查 Supabase Dashboard 的日志
2. 查看项目的 API 日志
3. 联系项目维护者