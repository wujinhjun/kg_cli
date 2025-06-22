#!/bin/bash
# KG-CLI pnpm包发布脚本

set -e

echo "🚀 开始发布 KG-CLI pnpm包..."

# 检查是否在Git仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "❌ 有未提交的更改，请先提交"
    exit 1
fi

# 检查是否在main/master分支
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
    echo "⚠️  当前不在main/master分支，当前分支: $current_branch"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查pnpm登录状态
echo "🔐 检查pnpm登录状态..."
if ! pnpm whoami > /dev/null 2>&1; then
    echo "❌ 未登录pnpm，请先登录"
    pnpm login
fi

# 检查包名是否可用
echo "🔍 检查包名是否可用..."
if pnpm view kg-cli > /dev/null 2>&1; then
    echo "⚠️  包名 kg-cli 已存在，请修改package.json中的name字段"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 运行测试
echo "🧪 运行测试..."
pnpm test

# 构建包
echo "🔨 构建包..."
pnpm run build

# 创建包文件
echo "📦 创建包文件..."
pnpm pack

# 显示包信息
echo "📋 包信息："
ls -la *.tgz

# 询问发布类型
echo ""
echo "📦 选择发布类型："
echo "1) 补丁版本 (patch) - 1.0.0 -> 1.0.1"
echo "2) 次要版本 (minor) - 1.0.0 -> 1.1.0"
echo "3) 主要版本 (major) - 1.0.0 -> 2.0.0"
echo "4) 当前版本 (不更新版本号)"
read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo "📤 发布补丁版本..."
        pnpm run publish:patch
        ;;
    2)
        echo "📤 发布次要版本..."
        pnpm run publish:minor
        ;;
    3)
        echo "📤 发布主要版本..."
        pnpm run publish:major
        ;;
    4)
        echo "📤 发布当前版本..."
        pnpm publish
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 发布完成！"
echo ""
echo "📝 后续步骤："
echo "1. 创建Git标签: git tag v$(pnpm run version --silent)"
echo "2. 推送标签: git push origin v$(pnpm run version --silent)"
echo "3. 在GitHub上创建Release"
echo "4. 更新文档和README"
echo ""
echo "🔗 安装命令: pnpm install -g kg-cli" 