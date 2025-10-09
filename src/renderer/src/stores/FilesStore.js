import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 文件管理状态
export const useFilesStore = defineStore('files', () => {
  // 基础状态
  const isProcessing = ref(false) // 是否正在处理
  const files = ref([]) // 文件列表
  const selectedFileIds = ref([]) // 选中的文件ID列表
  const newName = ref([]) // 每个文件的重命名表单数据

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
    const addedFiles = []

    newFiles.forEach((fileData, index) => {
      const filePath = fileData.path

      // 检查文件是否已存在（根据路径去重）
      const existingFile = files.value.find((f) => f.path === filePath)
      if (existingFile) {
        console.log(`文件已存在，跳过: ${filePath}`)
        return
      }

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
      addedFiles.push(file)

      // 为每个文件初始化重命名表单数据，使用表单默认值
      const renameData = {
        fileId: file.id,
        // 压制组相关
        encoderGroup: '',
        encoderGroupCustom: false,
        // 字幕组相关
        subtitleGroup: '',
        subtitleGroupCustom: false,
        // 基本信息
        workName: '',
        workAlias: '',
        workYear: null,
        resolution: '1080p', // 使用默认分辨率
        // 集数信息
        season: 1,
        startEpisode: 1, // 添加起始集数默认值
        episode: index + 1, // 根据文件顺序自动设置集数
        isMovie: false, // 是否是电影
        // 格式信息
        videoFormat: '',
        audioFormat: '',
        source: ''
      }

      newName.value.push(renameData)
    })

    return addedFiles
  }

  // 清空文件列表
  const clearFiles = () => {
    files.value = []
    selectedFileIds.value = []
    newName.value = [] // 清空重命名数据
  }

  // 删除文件
  const removeFile = (fileId) => {
    const index = files.value.findIndex((file) => file.id === fileId)
    if (index !== -1) {
      files.value.splice(index, 1)
      newName.value.splice(index, 1) // 同时删除对应的重命名数据
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

  // 更新单个文件的重命名表单数据
  const updateFileRenameData = (fileId, fieldName, value) => {
    const renameData = newName.value.find((data) => data.fileId === fileId)
    if (renameData) {
      renameData[fieldName] = value
    }
  }

  // 批量更新所有文件的重命名表单数据（用于全局表单更新）
  const updateAllFilesRenameData = (formData) => {
    newName.value.forEach((renameData, index) => {
      // 更新除了fileId之外的所有字段
      Object.keys(formData).forEach((key) => {
        if (key !== 'fileId') {
          if (key === 'startEpisode') {
            // 当起始集数变化时，重新计算每个文件的集数
            renameData.episode = parseInt(formData.startEpisode) + index
          } else {
            renameData[key] = formData[key]
          }
        }
      })
    })
  }

  // 根据表单数据生成新文件名
  const generateNewFileName = (fileId) => {
    const file = files.value.find((f) => f.id === fileId)
    const renameData = newName.value.find((data) => data.fileId === fileId)

    if (!file || !renameData) return ''

    const parts = []

    // 压制组&&字幕组
    const encoderGroup = renameData.encoderGroup
    const subtitleGroup = renameData.subtitleGroup

    if (
      encoderGroup &&
      encoderGroup.trim() !== '' &&
      subtitleGroup &&
      subtitleGroup.trim() !== '' &&
      encoderGroup !== subtitleGroup
    ) {
      parts.push(`[${encoderGroup}&&${subtitleGroup}]`)
    } else if (encoderGroup && encoderGroup.trim() !== '') {
      parts.push(`[${encoderGroup}]`)
    } else if (subtitleGroup && subtitleGroup.trim() !== '') {
      parts.push(`[${subtitleGroup}]`)
    } else {
      parts.push('[个人收集]')
    }

    // 作品名
    if (renameData.workName) {
      parts.push(`[${renameData.workName}]`)
    }

    // 作品别名
    if (renameData.workAlias) {
      parts.push(`[${renameData.workAlias}]`)
    }

    // 年份
    if (renameData.workYear) {
      parts.push(`[${renameData.workYear}]`)
    }

    // 分辨率
    if (renameData.resolution) {
      parts.push(`[${renameData.resolution}]`)
    }

    // 季数和集数（如果不是电影才添加）
    if (!renameData.isMovie && renameData.season && renameData.episode) {
      const seasonStr = renameData.season.toString().padStart(2, '0')
      const episodeStr = renameData.episode.toString().padStart(2, '0')
      parts.push(`[S${seasonStr}E${episodeStr}]`)
    }

    // 视频格式
    if (renameData.videoFormat) {
      parts.push(`[${renameData.videoFormat}]`)
    }

    // 音频格式
    if (renameData.audioFormat) {
      parts.push(`[${renameData.audioFormat}]`)
    }

    // 来源
    if (renameData.source) {
      parts.push(`[${renameData.source}]`)
    }

    // 添加文件扩展名
    const fileName = parts.join('') + '.' + file.extension

    // 更新存储的新文件名
    renameData.newFileName = fileName

    return fileName
  }

  // 获取文件的重命名数据
  const getFileRenameData = (fileId) => {
    return newName.value.find((data) => data.fileId === fileId)
  }

  // 获取所有重命名数据
  const getAllRenameData = () => {
    return newName.value
  }

  return {
    // 状态
    isProcessing,
    files,
    selectedFileIds,
    newName,

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
    updateFileInfo,

    // 重命名相关方法
    updateFileRenameData,
    updateAllFilesRenameData,
    generateNewFileName,
    getFileRenameData,
    getAllRenameData
  }
})
