#!/bin/bash

echo "=========================================="
echo "CaoTaiHub 部署脚本"
echo "=========================================="
echo ""

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 CaoTaiHub 目录下运行此脚本"
    exit 1
fi

# 步骤1：检查环境变量
echo "📋 步骤1：检查环境变量..."
if [ ! -f ".env.local" ]; then
    echo "❌ 缺少 .env.local 文件"
    exit 1
fi

source .env.local 2>/dev/null || true

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ 请先配置 .env.local 中的环境变量"
    exit 1
fi
echo "✅ 环境变量已配置"

# 步骤2：构建检查
echo ""
echo "📋 步骤2：检查构建..."
npm run build 2>&1 | tail -20
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ 构建失败，请检查错误"
    exit 1
fi
echo "✅ 构建成功"

# 步骤3：Vercel 登录
echo ""
echo "📋 步骤3：Vercel 登录..."
echo "请在浏览器中完成登录..."
vercel login

# 步骤4：部署
echo ""
echo "📋 步骤4：部署到 Vercel..."
echo "请按提示操作："
echo "- 选择 'Create a new Project'"
echo "- 项目名输入 'caotaihub'"
echo "- 其他选项直接回车使用默认值"
echo ""
vercel --prod

echo ""
echo "=========================================="
echo "🎉 部署完成！"
echo ""
echo "下一步："
echo "1. 在 Vercel Dashboard 中设置环境变量"
echo "2. 初始化 Supabase 数据库"
echo "=========================================="
