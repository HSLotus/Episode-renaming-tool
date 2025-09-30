import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 渲染进程的自定义 API
const api = {
  // 打开文件选择对话框
  openFileDialog: async () => {
    return await ipcRenderer.invoke('open-file-dialog')
  },

  // 文件重命名 API
  renameFile: async (oldPath, newPath) => {
    return await ipcRenderer.invoke('rename-file', { oldPath, newPath })
  },

  // 读取文件内容 API
  readFile: async (filePath) => {
    const result = await ipcRenderer.invoke('read-file', filePath)
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.error)
    }
  }
}

// 使用 `contextBridge` API 将 Electron API 暴露给渲染进程
// 仅在启用上下文隔离时使用，否则直接添加到 DOM 全局对象
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
