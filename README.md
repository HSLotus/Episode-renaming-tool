# 剧集重命名工具

一个基于 Electron + Vue3 的跨平台桌面应用，专门用于批量重命名视频文件，特别适合动漫剧集的规范化命名。

## 主要功能

- 🏷️ **智能命名**: 根据压制组、字幕组、作品信息等生成规范文件名
- 📺 **自动获取视频信息**: 使用mediainfo.js，视频格式信息自动获取，无需手动输入
- ⚡ **批量处理**: 一键批量重命名多个文件

## 命名规范

生成的文件名格式：`[压制组&&字幕组][作品名][作品别名][年份][分辨率][S季数E集数][视频格式][音频格式][来源].扩展名`

示例：`[VCB-Studio&&喵萌奶茶屋][某某动画][2024][1080p][S01E01][H.264][AAC][BDZip].mkv`

## 技术栈

- **框架**: Electron 38.x + Vue 3.5.x + Vite 7.x
- **UI组件**: Element Plus 2.x
- **状态管理**: Pinia 3.x

## 开发环境

### 安装依赖

```bash
npm install
```

### 启动开发

```bash
npm run dev
```

### 构建应用

```bash
# Windows 版本
npm run build:win

# macOS 版本  
npm run build:mac

# Linux 版本
npm run build:linux
```

## 推荐开发环境

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
