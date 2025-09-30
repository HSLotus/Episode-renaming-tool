import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { access, constants, rename } from 'fs/promises'
import { promises as fs } from 'fs'
import { dirname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 基于 electron-vite cli 的渲染进程热重载
  // 开发环境加载远程URL，生产环境加载本地HTML文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 当 Electron 完成初始化并准备创建浏览器窗口时，将调用此方法
// 某些 API 只能在此事件发生后使用
app.whenReady().then(() => {
  // 为 Windows 设置应用用户模型 ID
  electronApp.setAppUserModelId('com.electron')

  // 在开发环境中默认通过 F12 打开或关闭开发者工具
  // 在生产环境中忽略 CommandOrControl + R
  // 参见 https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC 测试
  ipcMain.on('ping', () => console.log('pong'))

  // 文件选择对话框 IPC 处理器
  ipcMain.handle('open-file-dialog', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择视频文件',
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: '视频文件',
            extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'm4v', 'webm', '3gp', 'ts']
          },
          {
            name: '所有文件',
            extensions: ['*']
          }
        ]
      })

      if (result.canceled) {
        return {
          success: false,
          message: '用户取消选择'
        }
      }

      // 获取文件详细信息
      const filesWithDetails = await Promise.all(
        result.filePaths.map(async (filePath) => {
          try {
            const stats = await fs.stat(filePath)
            return {
              path: filePath,
              size: stats.size,
              raw: {
                path: filePath,
                size: stats.size,
                lastModified: stats.mtime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory()
              }
            }
          } catch (error) {
            console.error(`获取文件信息失败: ${filePath}`, error)
            return {
              path: filePath,
              size: 0,
              raw: {
                path: filePath,
                size: 0,
                lastModified: null,
                isFile: true,
                isDirectory: false
              }
            }
          }
        })
      )

      return {
        success: true,
        files: filesWithDetails
      }
    } catch (error) {
      console.error('文件选择失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // 文件重命名 IPC 处理器
  ipcMain.handle('rename-file', async (event, { oldPath, newPath }) => {
    try {
      // 检查源文件是否存在
      await access(oldPath, constants.F_OK)

      // 获取新文件的目录路径
      const newDir = dirname(newPath)

      // 检查目标目录是否存在（如果不存在会抛出错误）
      try {
        await access(newDir, constants.F_OK)
      } catch (error) {
        throw new Error(`目标目录不存在: ${newDir}: ${error.message}`)
      }

      // 检查目标文件是否已存在
      try {
        await access(newPath, constants.F_OK)
        throw new Error(`目标文件已存在: ${newPath}`)
      } catch (error) {
        // 如果文件不存在，这是我们期望的情况
        if (error.code !== 'ENOENT') {
          throw error
        }
      }

      // 执行重命名
      await rename(oldPath, newPath)

      return {
        success: true,
        message: '文件重命名成功'
      }
    } catch (error) {
      console.error('文件重命名失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // 读取文件内容 IPC 处理器
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const fileBuffer = await fs.readFile(filePath)
      return {
        success: true,
        data: fileBuffer
      }
    } catch (error) {
      console.error('读取文件失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  createWindow()

  app.on('activate', function () {
    // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，
    // 通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都关闭时退出应用，除了在 macOS 上
// 在 macOS 上，应用程序和它们的菜单栏通常保持活动状态，
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 在此文件中，您可以包含应用程序特定主进程的其余代码
// 您也可以将它们放在单独的文件中并在此处引入
