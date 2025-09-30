import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 文件管理状态
export const useFilesStore = defineStore('files', () => {
  // 基础状态
  const isProcessing = ref(false) // 是否正在处理
  const files = ref([]) // 文件列表
  const selectedFileIds = ref([]) // 选中的文件ID列表

  // 计算属性：选中的文件
  const selectedFiles = computed(() => {
    return files.value.filter((file) => selectedFileIds.value.includes(file.id))
  })

  // 计算属性：文件总数
  const totalFiles = computed(() => files.value.length)

  // 计算属性：选中文件数
  const selectedCount = computed(() => selectedFileIds.value.length)

  // 设置处理状态
  const setProcessing = (status) => {
    isProcessing.value = status
  }

  // 添加文件
  const addFiles = (newFiles) => {
    const timestamp = Date.now()
    newFiles.forEach((fileData, index) => {
      const filePath = fileData.path
      const fileName = filePath.split(/[/\\]/).pop() // 获取文件名
      const fileExtension = fileName.split('.').pop().toLowerCase() // 获取文件扩展名

      const file = {
        id: `${timestamp}_${index}`, // 唯一ID
        name: fileName, // 文件名
        path: filePath, // 文件完整路径
        extension: fileExtension, // 文件扩展名
        size: fileData.size || 0, // 文件大小
        selected: false, // 是否选中
        raw: fileData.raw || { path: filePath } // 原始文件信息
      }

      files.value.push(file)
    })
    console.log('files', files.value)
  }

  // 清空文件列表
  const clearFiles = () => {
    files.value = []
    selectedFileIds.value = []
  }

  // 删除文件
  const removeFile = (fileId) => {
    const index = files.value.findIndex((file) => file.id === fileId)
    if (index !== -1) {
      files.value.splice(index, 1)
      // 同时从选中列表中移除
      const selectedIndex = selectedFileIds.value.indexOf(fileId)
      if (selectedIndex !== -1) {
        selectedFileIds.value.splice(selectedIndex, 1)
      }
    }
  }

  // 删除多个文件
  const removeFiles = (fileIds) => {
    fileIds.forEach((fileId) => removeFile(fileId))
  }

  // 选中/取消选中文件
  const toggleFileSelection = (fileId) => {
    const index = selectedFileIds.value.indexOf(fileId)
    if (index === -1) {
      selectedFileIds.value.push(fileId)
    } else {
      selectedFileIds.value.splice(index, 1)
    }
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFileIds.value.length === files.value.length) {
      // 当前全选，取消全选
      selectedFileIds.value = []
    } else {
      // 全选
      selectedFileIds.value = files.value.map((file) => file.id)
    }
  }

  // 设置文件选中状态
  const setFileSelection = (fileId, selected) => {
    const index = selectedFileIds.value.indexOf(fileId)
    if (selected && index === -1) {
      selectedFileIds.value.push(fileId)
    } else if (!selected && index !== -1) {
      selectedFileIds.value.splice(index, 1)
    }
  }

  // 更新文件排序
  const updateFileOrder = (newFiles) => {
    files.value = newFiles
  }

  // 获取选中的文件（兼容现有代码）
  const getSelectedFiles = () => {
    return selectedFiles.value
  }

  // 更新文件信息（用于重命名后更新）
  const updateFileInfo = (fileId, newName, newPath) => {
    const file = files.value.find((f) => f.id === fileId)
    if (file) {
      file.name = newName
      file.path = newPath
      if (file.raw) {
        file.raw.path = newPath
      }
    }
  }

  return {
    // 状态
    isProcessing,
    files,
    selectedFileIds,

    // 计算属性
    selectedFiles,
    totalFiles,
    selectedCount,

    // 方法
    setProcessing,
    addFiles,
    clearFiles,
    removeFile,
    removeFiles,
    toggleFileSelection,
    toggleSelectAll,
    setFileSelection,
    updateFileOrder,
    getSelectedFiles,
    updateFileInfo
  }
})
