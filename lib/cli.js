/**
 * 知识库命令行工具核心类
 * 支持检测Git知识库、克隆和创建软链接
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const simpleGit = require('simple-git');
const os = require('os');

class KnowledgeBaseCLI {
  constructor() {
    this.configFile = path.join(os.homedir(), '.kg-cli', 'config.json');
    this.reposDir = path.join(os.homedir(), '.kg-cli', 'repos');
    this.linkDir = path.join(os.homedir(), '.kg-cli', 'links');
    this.ensureDirs();
    this.config = this.loadConfig();
  }

  ensureDirs() {
    fs.ensureDirSync(path.dirname(this.configFile));
    fs.ensureDirSync(this.reposDir);
    fs.ensureDirSync(this.linkDir);
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        return fs.readJsonSync(this.configFile);
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️  读取配置文件失败: ${error.message}`));
    }
    return {};
  }

  saveConfig() {
    try {
      fs.writeJsonSync(this.configFile, this.config, { spaces: 2 });
    } catch (error) {
      console.log(chalk.red(`保存配置文件失败: ${error.message}`));
    }
  }

  getPlatform() {
    const platform = os.platform();
    if (platform === 'darwin') return 'macos';
    if (platform === 'win32') return 'windows';
    if (platform === 'linux') return 'linux';
    return 'unknown';
  }

  async createSymlink(source, target) {
    try {
      // 如果目标已存在，先删除
      if (fs.existsSync(target)) {
        const stats = fs.lstatSync(target);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(target);
        } else if (stats.isDirectory()) {
          fs.removeSync(target);
        } else {
          fs.unlinkSync(target);
        }
      }

      // 创建软链接
      if (this.getPlatform() === 'windows') {
        // Windows 需要管理员权限或开发者模式
        const { execSync } = require('child_process');
        const isDirectory = fs.statSync(source).isDirectory();
        const command = isDirectory
          ? `mklink /D "${target}" "${source}"`
          : `mklink "${target}" "${source}"`;

        execSync(command, { shell: true });
      } else {
        // Unix-like 系统
        fs.symlinkSync(source, target);
      }

      console.log(chalk.green(`✅ 软链接创建成功: ${target} -> ${source}`));
      return true;
    } catch (error) {
      console.log(chalk.red(`❌ 创建软链接失败: ${error.message}`));
      return false;
    }
  }

  async gitClone(repoUrl, repoName) {
    const repoPath = path.join(this.reposDir, repoName);

    if (fs.existsSync(repoPath)) {
      console.log(chalk.blue(`📁 仓库已存在: ${repoPath}`));
      return repoPath;
    }

    console.log(chalk.blue(`📥 正在克隆仓库: ${repoUrl}`));

    try {
      const git = simpleGit();
      await git.clone(repoUrl, repoPath);
      console.log(chalk.green(`✅ 克隆完成: ${repoPath}`));
      return repoPath;
    } catch (error) {
      console.log(chalk.red(`❌ Git克隆失败: ${error.message}`));
      return null;
    }
  }

  async gitPull(repoPath) {
    console.log(chalk.blue(`🔄 更新仓库: ${repoPath}`));

    try {
      const git = simpleGit(repoPath);
      await git.pull();
      console.log(chalk.green(`✅ 更新完成: ${repoPath}`));
      return true;
    } catch (error) {
      console.log(chalk.red(`❌ Git更新失败: ${error.message}`));
      return false;
    }
  }

  async detectKnowledgeBase(name, paths) {
    console.log(chalk.blue(`🔍 检测知识库: ${name}`));

    for (const pathStr of paths) {
      const expandedPath = pathStr.replace(/^~/, os.homedir());
      if (fs.existsSync(expandedPath)) {
        // 检查是否是Git仓库
        const gitDir = path.join(expandedPath, '.git');
        if (fs.existsSync(gitDir)) {
          console.log(chalk.green(`✅ 找到Git知识库: ${expandedPath}`));
          return expandedPath;
        } else {
          console.log(
            chalk.yellow(`⚠️  找到目录但不是Git仓库: ${expandedPath}`),
          );
        }
      }
    }

    console.log(chalk.red(`❌ 未找到知识库: ${name}`));
    return null;
  }

  async cloneKnowledgeBase(name, repoUrl) {
    console.log(chalk.blue(`📥 开始克隆知识库: ${name}`));

    // 克隆仓库
    const repoPath = await this.gitClone(repoUrl, name);
    if (!repoPath) {
      return null;
    }

    // 更新配置
    this.config[name] = {
      path: repoPath,
      repo_url: repoUrl,
      cloned_at: new Date().toISOString(),
    };
    this.saveConfig();

    return repoPath;
  }

  async createLink(name, sourcePath, linkName = null) {
    if (!linkName) {
      linkName = name;
    }

    const linkPath = path.join(this.linkDir, linkName);

    console.log(chalk.blue(`🔗 创建软链接: ${linkPath} -> ${sourcePath}`));
    return await this.createSymlink(sourcePath, linkPath);
  }

  async setupKnowledgeBase(name, config) {
    console.log(chalk.blue(`🚀 开始设置知识库: ${name}`));

    // 1. 检测本地是否存在
    const localPaths = config.local_paths || [];
    if (localPaths.length > 0) {
      const existingPath = await this.detectKnowledgeBase(name, localPaths);
      if (existingPath) {
        return await this.createLink(name, existingPath);
      }
    }

    // 2. 如果本地不存在，克隆
    const repoUrl = config.repo_url;

    if (!repoUrl) {
      console.log(chalk.red(`❌ 配置不完整，缺少仓库URL`));
      return false;
    }

    const clonedPath = await this.cloneKnowledgeBase(name, repoUrl);
    if (!clonedPath) {
      return false;
    }

    // 3. 创建软链接
    return await this.createLink(name, clonedPath);
  }

  async updateKnowledgeBase(name) {
    if (!this.config[name]) {
      console.log(chalk.red(`❌ 知识库不存在: ${name}`));
      return false;
    }

    const repoPath = this.config[name].path;
    if (!fs.existsSync(repoPath)) {
      console.log(chalk.red(`❌ 仓库路径不存在: ${repoPath}`));
      return false;
    }

    return await this.gitPull(repoPath);
  }

  async listKnowledgeBases() {
    console.log(chalk.blue('📚 已配置的知识库:'));

    for (const [name, info] of Object.entries(this.config)) {
      const repoPath = info.path;
      let status = chalk.red('❌ 未安装');

      if (fs.existsSync(repoPath)) {
        try {
          const git = simpleGit(repoPath);
          const statusResult = await git.status();
          if (statusResult.files.length > 0) {
            status = chalk.yellow('⚠️  有未提交更改');
          } else {
            status = chalk.green('✅ 已安装且最新');
          }
        } catch (error) {
          status = chalk.green('✅ 已安装');
        }
      }

      const repoUrl = info.repo_url || '未知';
      console.log(`  ${name}: ${status}`);
      console.log(`    路径: ${repoPath}`);
      console.log(`    仓库: ${repoUrl}`);
      console.log();
    }
  }

  async removeKnowledgeBase(name) {
    if (!this.config[name]) {
      console.log(chalk.red(`❌ 知识库不存在: ${name}`));
      return;
    }

    // 删除软链接
    const linkPath = path.join(this.linkDir, name);
    if (fs.existsSync(linkPath)) {
      const stats = fs.lstatSync(linkPath);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(linkPath);
      }
      console.log(chalk.green(`✅ 已删除软链接: ${linkPath}`));
    }

    // 删除克隆的仓库
    const repoPath = this.config[name].path;
    if (fs.existsSync(repoPath)) {
      fs.removeSync(repoPath);
      console.log(chalk.green(`✅ 已删除仓库: ${repoPath}`));
    }

    // 从配置中移除
    delete this.config[name];
    this.saveConfig();
    console.log(chalk.green(`✅ 已从配置中移除: ${name}`));
  }
}

module.exports = KnowledgeBaseCLI;
