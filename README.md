# KG-CLI - 知识库命令行工具

一个跨平台的Git知识库检测和软链接创建工具，支持 macOS 和 Windows。

## 功能特性

- 🔍 **智能检测**: 自动检测本地是否已存在Git知识库
- 📥 **自动克隆**: 如果本地不存在，自动克隆Git仓库
- 🔄 **仓库更新**: 支持更新已存在的Git仓库
- 🔗 **软链接创建**: 创建统一的软链接便于访问
- 🖥️ **跨平台支持**: 兼容 macOS、Windows 和 Linux
- 📝 **配置管理**: 支持 JSON 配置文件管理多个知识库
- 🌍 **全局安装**: 一次安装，全局使用

## 安装要求

- Node.js 12.0+
- pnpm（推荐）或 npm
- Git（用于克隆和更新仓库）

## 安装方法

### 全局安装

```bash
# 从pnpm安装（如果已发布）
pnpm install -g kg-cli

# 或者从本地安装
cd kg_npm_cli
pnpm install -g .
```

### 开发安装

```bash
cd kg_npm_cli
pnpm install
pnpm link --global
```

## 使用方法

### 基本命令

```bash
# 设置知识库
kg-cli setup <知识库名称> --config config.json

# 更新知识库
kg-cli update <知识库名称>

# 列出所有知识库
kg-cli list

# 移除知识库
kg-cli remove <知识库名称>

# 查看帮助
kg-cli --help
```

### 配置文件格式

创建一个 JSON 配置文件，定义知识库信息：

```json
{
  "python_docs": {
    "local_paths": [
      "/usr/local/share/python-docs",
      "C:\\Program Files\\Python\\Doc",
      "~/python-docs"
    ],
    "repo_url": "https://github.com/python/cpython.git"
  }
}
```

### 配置说明

- `local_paths`: 本地可能存在的知识库路径列表（按优先级排序）
- `repo_url`: 如果本地不存在时的Git仓库地址

### 使用示例

1. **设置 Python 文档知识库**:

   ```bash
   kg-cli setup python_docs --config config.json
   ```

2. **更新知识库**:

   ```bash
   kg-cli update python_docs
   ```

3. **查看已安装的知识库**:

   ```bash
   kg-cli list
   ```

4. **移除知识库**:

   ```bash
   kg-cli remove python_docs
   ```

## 工作流程

1. **检测阶段**: 工具会按顺序检查 `local_paths` 中定义的路径，确认是否为Git仓库
2. **克隆阶段**: 如果本地不存在，从 `repo_url` 克隆Git仓库
3. **链接阶段**: 在 `~/.kg-cli/links/` 目录创建软链接

## 目录结构

工具会在用户主目录创建以下结构：

```
~/.kg-cli/
├── config.json          # 配置文件
├── repos/              # Git仓库目录
│   └── python_docs/    # 克隆的Git仓库
└── links/              # 软链接目录
    └── python_docs -> ../repos/python_docs
```

## 平台兼容性

### macOS/Linux

- 使用 `fs.symlinkSync()` 创建软链接
- 支持所有Git操作

### Windows

- 使用 `mklink` 命令创建软链接
- 需要管理员权限或启用开发者模式
- 支持所有Git操作

## 注意事项

1. **Git要求**: 确保系统已安装Git并配置好
2. **Windows权限**: 在Windows上创建软链接需要管理员权限或启用开发者模式
3. **网络连接**: 克隆功能需要网络连接
4. **磁盘空间**: 确保有足够的磁盘空间存储Git仓库
5. **文件权限**: 确保对目标目录有写入权限

## 故障排除

### 软链接创建失败

- **Windows**: 以管理员身份运行或启用开发者模式
- **macOS/Linux**: 检查目录权限

### Git克隆失败

- 检查网络连接
- 验证Git仓库URL是否有效
- 检查磁盘空间
- 确认Git已正确安装

### Git更新失败

- 检查仓库是否有未提交的本地更改
- 确认网络连接正常
- 检查Git配置

### 全局安装问题

- 确保Node.js和pnpm已正确安装
- 检查PATH环境变量是否包含pnpm全局目录
- 在Windows上可能需要以管理员身份运行

## 开发

### 本地开发

```bash
# 克隆仓库
git clone <repository-url>
cd kg-cli/kg_npm_cli

# 安装依赖
pnpm install

# 链接到全局
pnpm link --global

# 运行测试
pnpm test

# 开发模式
pnpm dev
```

### 项目结构

```
kg_npm_cli/
├── bin/
│   └── kg-cli.js        # 命令行入口
├── lib/
│   └── cli.js           # 核心CLI类
├── package.json         # pnpm配置
├── config.json          # 示例配置
├── publish.sh           # 发布脚本 (Unix)
├── publish.bat          # 发布脚本 (Windows)
└── README.md            # 文档
```

## 发布到pnpm

```bash
# 登录到pnpm
pnpm login

# 发布包
pnpm publish

# 或者发布到测试版本
pnpm publish --tag beta

# 使用发布脚本
./publish.sh  # Unix
publish.bat   # Windows
```

## 可用的脚本命令

```bash
# 开发
pnpm dev              # 开发模式（自动重启）
pnpm start            # 运行CLI

# 安装
pnpm install:global   # 全局安装
pnpm uninstall:global # 全局卸载
pnpm link             # 链接到全局
pnpm unlink           # 取消链接

# 发布
pnpm publish          # 发布当前版本
pnpm publish:patch    # 发布补丁版本
pnpm publish:minor    # 发布次要版本
pnpm publish:major    # 发布主要版本
pnpm pack             # 创建包文件

# 构建
pnpm build            # 构建（无操作）
pnpm test             # 运行测试
```

## 许可证

MIT License
