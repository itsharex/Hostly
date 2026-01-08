# Hostly

### Hostly (极简 Hosts 切换工具)

一个基于 Tauri v2 + Rust 构建的**极致轻量**、高性能 Hosts 管理工具。我们通过移除前端框架（迁移至 Vanilla JS），将体积和性能优化到了极点。

<p align="center">
  <img src="https://raw.githubusercontent.com/zengyufei/hostly/main/img/index.png" alt="Hostly Main Interface" width="600" />
</p>

> 🤖 **特别说明**: 本项目由 AI 智能体 [Antigravity](https://gemini.google.com/) 深度参与设计与实现，追求极致的简洁与高效。

## ✨ 核心特性

- 🚀 **极速启动**: 采用 **JS + 原生 CSS** 实现。单文件应用大小 **1MB**，毫秒级冷启动。
- 🎨 **现代 UI**: 统一的侧边栏布局，无边框美学设计。
- 🔔 **非侵入式反馈**: 内置轻量级 Toast 通知系统，告别干扰式的确认弹窗。
- 🛡️ **智能提权**: 自动检测管理员权限并按需提权，支持直接编辑系统 Hosts 文件。
- ⚙️ **双模操作**: 完美支持 **GUI** 可视化操作与专业的 **CLI** 命令行调用。
- 🤖 **Headless CLI**: 提供独立的 `hostly-core` 二进制文件，专为服务器/CI环境设计，零GUI依赖。
- 🔄 **兼容迁移**: 支持一键导入 **SwitchHosts** json 备份，无缝切换无压力。
- 🍎 **全架构支持**: 提供 **macOS** (同时支持 Intel/Apple Silicon)，以及 Windows/Linux 全平台构建。
- 🔌 **数据便携**: 支持全量配置导入导出，轻松实现跨设备同步。

## 🧩 功能详情

- **侧边栏布局**: 统一管理“系统备份”、“公共配置”与“自定义环境”。
- **多模式并存**: 
  - **单选模式**: 互斥切换，保持 hosts 清爽。
  - **多选模式**: 多个环境同时勾选叠加生效。
- **系统文件编辑**: 提供安全的“编辑系统文件”工作流，支持即时保存并应用。
- **命令行 (CLI)**: 完整的子命令支持，分为两种模式：
  - `hostly`: 随 GUI 分发，适合桌面用户，支持 `open/list/export` 等操作。
  - `hostly-core`: **纯命令行版本**，体积更小，无视 GUI 依赖，适合自动化脚本。
- **交互细节**: 点击刷新按钮会有动态反馈，新建环境自动保持纯净。

## 🚀 快速开始

### 构建运行

```bash
# 克隆项目后
npm install

# 进入开发模式
npm run tauri dev

# 打包发布版 (产物在 src-tauri/target/release/)
npm run tauri build
```

### 常用命令行操作

您可以使用 `hostly` 或 `hostly-core` 执行以下命令：

> **提示**: 在 Windows 下运行 CLI 命令会自动请求 UAC 提权。

| 命令 | 说明 | 示例 |
| :--- | :--- | :--- |
| `list` | 列出所有配置及其状态 | `hostly list` |
| `open` | 激活一个或多个环境 | `hostly open --names Dev Test --multi` |
| `close` | 关闭指定环境 | `hostly close --names Dev` |
| `toggle` | 切换指定环境状态 | `hostly toggle --names Dev` |
| `multi / single` | 切换全局选择模式 | `hostly multi` |
| `export` | 导出配置或备份 | `hostly export --target backup.json` |
| `import` | 导入配置(支持SwitchHosts) | `hostly import --target backup.json` |

## 🛠️ 常见问题

**Q: 为什么生成的体积比 Vue/React 版本小这么多？**
A: 因为我们直接使用了浏览器原生的 DOM 操作和原生 CSS，完全不依赖任何第三方重量级库，从而实现了极致的运行时开销和文件体积。

**Q: 命令行模式怎么在脚本里用？**
A: 您可以将构建出的 `.exe` 或二进制文件路径添加到环境变量，然后在任何终端中直接调用子命令。

**Q: 双击打不开或提示权限不足？**
A: 程序内置了自提权机制。如果遇到问题，请确保您的 Windows 账户具备管理员资格。首次运行时会有 UAC 弹窗，请点击“是”。

**Q: 命令行执行完为什么弹出了个新窗口就关了？** 
A: 这是因为主进程是非管理员启动的，为了获得权限，它启动了一个新的管理员子进程来执行命令。这是正常的 Windows 安全机制。

## 📄 License
MIT
