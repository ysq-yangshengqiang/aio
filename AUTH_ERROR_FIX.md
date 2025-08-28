# 用户注册Auth错误修复指南

## 问题描述
注册时出现错误：`column "full_name" of relation "user_profiles" does not exist`

## 错误原因
数据库迁移没有正确执行，导致 `user_profiles` 表缺少 `full_name` 列，但触发器函数试图向该列插入数据。

## 解决方案

### 方法1：在 Supabase 控制台手动执行修复脚本

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 **SQL Editor**
4. 复制并执行 `database/fix_user_profiles.sql` 文件中的所有 SQL 代码
5. 确认看到成功消息

### 方法2：使用 Supabase CLI（如果已安装）

```bash
# 确保已登录 Supabase CLI
supabase login

# 应用修复迁移
supabase db push

# 或者直接执行修复脚本
supabase db reset
```

### 方法3：重新初始化数据库

如果上述方法不起作用，可以重置整个数据库：

1. 在 Supabase 控制台进入 **Settings** > **Database**
2. 点击 **Reset Database**（⚠️ 这将删除所有数据）
3. 重新执行 `database/migrations/001_create_student_system_tables.sql`

## 验证修复

修复完成后，可以通过以下 SQL 验证：

```sql
-- 检查 user_profiles 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';

-- 检查触发器
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

应该看到：
- `full_name` 列存在于 `user_profiles` 表中
- `on_auth_user_created` 触发器存在

## 测试注册

修复完成后，尝试注册新用户：
1. 访问注册页面
2. 填写用户信息
3. 提交注册表单
4. 应该能够成功注册而不出现数据库错误

## 预防措施

为避免类似问题：
1. 确保所有数据库迁移都正确执行
2. 在生产环境部署前先在开发环境测试
3. 定期备份数据库
4. 监控应用日志以及时发现问题

## 联系支持

如果问题仍然存在，请提供：
- 完整的错误日志
- Supabase 项目 ID
- 执行的修复步骤