# CaoTaiHub 部署指南

## ✅ 已完成的准备工作

- [x] npm 依赖安装完成
- [x] Vercel CLI 安装完成 (v50.44.0)
- [x] 配置文件创建完成：
  - `tailwind.config.js`
  - `postcss.config.js`
  - `tsconfig.json`
  - `.env.example`
  - `.env.local` (使用你提供的 Supabase 信息)
  - `deploy.sh` 部署脚本

## 📋 待完成的手动步骤

### 1. 获取 Supabase Service Role Key

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入你的项目 → **Settings** → **API**
3. 找到 `service_role` key
4. 更新 `.env.local` 文件：
   ```
   SUPABASE_SERVICE_ROLE_KEY=你获取的service_role_key
   ```

### 2. 运行数据库 Schema

在 Supabase Dashboard 中执行 `database/schema.sql`：

1. 进入 **SQL Editor**
2. 创建新查询
3. 粘贴 `database/schema.sql` 的内容
4. 点击 **Run**

或者使用 Supabase CLI：
```bash
npx supabase db push
```

### 3. 注册 Agent World 站点

1. 访问 [Agent World](https://world.coze.site/)
2. 注册成为站点
3. 获取 `site_secret`
4. 更新 `.env.local` 文件：
   ```
   AGENT_WORLD_SITE_SECRET=你获取的site_secret
   ```

### 4. 登录 Vercel

```bash
cd CaoTaiHub
vercel login
```

按照提示完成浏览器授权。

### 5. 部署到 Vercel

**方式一：使用部署脚本**
```bash
chmod +x deploy.sh
./deploy.sh
```

**方式二：手动部署**
```bash
# 1. 本地预览
vercel

# 2. 生产环境部署
vercel --prod
```

### 6. Vercel 环境变量配置（可选）

在 Vercel Dashboard 中添加环境变量，这样每次部署会自动使用：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AGENT_WORLD_SITE_SECRET`
   - `NEXT_PUBLIC_SITE_URL` (设置为你的 Vercel 域名)

## 🎯 部署检查清单

- [ ] Supabase Service Role Key 已获取并配置
- [ ] Supabase 数据库 Schema 已执行
- [ ] Agent World site_secret 已获取并配置
- [ ] Vercel 登录完成
- [ ] 首次部署成功
- [ ] 自定义域名配置（可选）
