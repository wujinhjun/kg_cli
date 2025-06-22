@echo off
REM KG-CLI pnpm包发布脚本 (Windows)

echo 🚀 开始发布 KG-CLI pnpm包...

REM 检查是否在Git仓库中
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ 当前目录不是Git仓库
    pause
    exit /b 1
)

REM 检查是否有未提交的更改
git diff-index --quiet HEAD -- >nul 2>&1
if errorlevel 1 (
    echo ❌ 有未提交的更改，请先提交
    pause
    exit /b 1
)

REM 检查pnpm登录状态
echo 🔐 检查pnpm登录状态...
pnpm whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ 未登录pnpm，请先登录
    pnpm login
)

REM 检查包名是否可用
echo 🔍 检查包名是否可用...
pnpm view kg-cli >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  包名 kg-cli 已存在，请修改package.json中的name字段
    pause
    exit /b 1
)

REM 安装依赖
echo 📦 安装依赖...
pnpm install

REM 运行测试
echo 🧪 运行测试...
pnpm test

REM 构建包
echo 🔨 构建包...
pnpm run build

REM 创建包文件
echo 📦 创建包文件...
pnpm pack

REM 显示包信息
echo 📋 包信息：
dir *.tgz

REM 询问发布类型
echo.
echo 📦 选择发布类型：
echo 1) 补丁版本 (patch) - 1.0.0 -^> 1.0.1
echo 2) 次要版本 (minor) - 1.0.0 -^> 1.1.0
echo 3) 主要版本 (major) - 1.0.0 -^> 2.0.0
echo 4) 当前版本 (不更新版本号)
set /p choice="请选择 (1-4): "

if "%choice%"=="1" (
    echo 📤 发布补丁版本...
    pnpm run publish:patch
) else if "%choice%"=="2" (
    echo 📤 发布次要版本...
    pnpm run publish:minor
) else if "%choice%"=="3" (
    echo 📤 发布主要版本...
    pnpm run publish:major
) else if "%choice%"=="4" (
    echo 📤 发布当前版本...
    pnpm publish
) else (
    echo ❌ 无效选择
    pause
    exit /b 1
)

echo.
echo 🎉 发布完成！
echo.
echo 📝 后续步骤：
echo 1. 创建Git标签: git tag v%npm_package_version%
echo 2. 推送标签: git push origin v%npm_package_version%
echo 3. 在GitHub上创建Release
echo 4. 更新文档和README
echo.
echo 🔗 安装命令: pnpm install -g kg-cli
pause 