#!/usr/bin/env node
/**
 * KG-CLI - 知识库命令行工具
 * 支持检测Git知识库、克隆和创建软链接
 */

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const KnowledgeBaseCLI = require('../lib/cli');

const program = new Command();

// 设置版本和描述
program
  .name('kg-cli')
  .description('知识库命令行工具 - 支持检测Git知识库、克隆和创建软链接')
  .version('1.0.0');

// setup 命令
program
  .command('setup <name>')
  .description('设置知识库')
  .option('-c, --config <path>', '配置文件路径')
  .option('-t, --target-dir <path>', '软链接目标目录（默认为当前目录）')
  .option('--no-gitignore', '跳过添加到 .gitignore 文件')
  .action(async (name, options) => {
    const cli = new KnowledgeBaseCLI();

    try {
      // 确定目标目录
      const targetDir = options.targetDir || process.cwd();
      const skipGitignore = options.gitignore === false;

      if (options.config) {
        // 从配置文件加载
        const configs = await fs.readJson(options.config);
        if (configs[name]) {
          const success = await cli.setupKnowledgeBase(
            name,
            configs[name],
            targetDir,
            skipGitignore,
          );
          if (success) {
            console.log(chalk.green(`✅ 知识库 ${name} 设置完成`));
            console.log(chalk.blue(`📁 软链接已创建在: ${targetDir}`));
            if (!skipGitignore) {
              console.log(chalk.blue(`📝 已自动添加到 .gitignore`));
            }
          } else {
            console.log(chalk.red(`❌ 知识库 ${name} 设置失败`));
          }
        } else {
          console.log(chalk.red(`❌ 配置文件中未找到知识库: ${name}`));
        }
      } else {
        // 使用示例配置
        const exampleConfig = {
          python_docs: {
            local_paths: [
              '/usr/local/share/python-docs',
              'C:\\Program Files\\Python\\Doc',
              path.join(
                process.env.HOME || process.env.USERPROFILE,
                'python-docs',
              ),
            ],
            repo_url: 'https://github.com/python/cpython.git',
          },
          nodejs_docs: {
            local_paths: [
              '/usr/local/share/nodejs-docs',
              'C:\\Program Files\\nodejs\\docs',
              path.join(
                process.env.HOME || process.env.USERPROFILE,
                'nodejs-docs',
              ),
            ],
            repo_url: 'https://github.com/nodejs/node.git',
          },
        };

        if (exampleConfig[name]) {
          const success = await cli.setupKnowledgeBase(
            name,
            exampleConfig[name],
            targetDir,
            skipGitignore,
          );
          if (success) {
            console.log(chalk.green(`✅ 知识库 ${name} 设置完成`));
            console.log(chalk.blue(`📁 软链接已创建在: ${targetDir}`));
            if (!skipGitignore) {
              console.log(chalk.blue(`📝 已自动添加到 .gitignore`));
            }
          } else {
            console.log(chalk.red(`❌ 知识库 ${name} 设置失败`));
          }
        } else {
          console.log(chalk.red(`❌ 未找到知识库配置: ${name}`));
          console.log('请使用 --config 参数指定配置文件');
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ 操作失败: ${error.message}`));
    }
  });

// update 命令
program
  .command('update <name>')
  .description('更新知识库')
  .action(async (name) => {
    const cli = new KnowledgeBaseCLI();

    try {
      const success = await cli.updateKnowledgeBase(name);
      if (success) {
        console.log(chalk.green(`✅ 知识库 ${name} 更新完成`));
      } else {
        console.log(chalk.red(`❌ 知识库 ${name} 更新失败`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ 操作失败: ${error.message}`));
    }
  });

// list 命令
program
  .command('list')
  .description('列出所有知识库')
  .action(async () => {
    const cli = new KnowledgeBaseCLI();

    try {
      await cli.listKnowledgeBases();
    } catch (error) {
      console.log(chalk.red(`❌ 操作失败: ${error.message}`));
    }
  });

// remove 命令
program
  .command('remove <name>')
  .description('移除知识库')
  .action(async (name) => {
    const cli = new KnowledgeBaseCLI();

    try {
      await cli.removeKnowledgeBase(name);
    } catch (error) {
      console.log(chalk.red(`❌ 操作失败: ${error.message}`));
    }
  });

// link 命令 - 在当前目录创建知识库软链接
program
  .command('link <name>')
  .description('在当前目录创建知识库软链接')
  .option('-t, --target-dir <path>', '软链接目标目录（默认为当前目录）')
  .option('--no-gitignore', '跳过添加到 .gitignore 文件')
  .action(async (name, options) => {
    const cli = new KnowledgeBaseCLI();

    try {
      const targetDir = options.targetDir || process.cwd();
      const skipGitignore = options.gitignore === false;

      // 检查知识库是否已配置
      if (!cli.config[name]) {
        console.log(chalk.red(`❌ 知识库不存在: ${name}`));
        console.log(chalk.yellow('💡 请先使用 setup 命令设置知识库'));
        return;
      }

      const repoPath = cli.config[name].path;
      if (!fs.existsSync(repoPath)) {
        console.log(chalk.red(`❌ 知识库路径不存在: ${repoPath}`));
        return;
      }

      const success = await cli.createLink(
        name,
        repoPath,
        null,
        targetDir,
        skipGitignore,
      );
      if (success) {
        console.log(chalk.green(`✅ 知识库软链接创建成功`));
        console.log(chalk.blue(`📁 软链接位置: ${path.join(targetDir, name)}`));
        if (!skipGitignore) {
          console.log(chalk.blue(`📝 已自动添加到 .gitignore`));
        }
      } else {
        console.log(chalk.red(`❌ 软链接创建失败`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ 操作失败: ${error.message}`));
    }
  });

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log('\n📝 使用示例:');
  console.log('  kg-cli setup python_docs --config config.json');
  console.log(
    '  kg-cli setup python_docs --config config.json --target-dir ./docs',
  );
  console.log('  kg-cli setup python_docs --config config.json --no-gitignore');
  console.log('  kg-cli link python_docs');
  console.log('  kg-cli link python_docs --target-dir ./docs');
  console.log('  kg-cli link python_docs --no-gitignore');
  console.log('  kg-cli update python_docs');
  console.log('  kg-cli list');
  console.log('  kg-cli remove python_docs');
}

program.parse();
