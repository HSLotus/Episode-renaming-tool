import { defineStore } from 'pinia'
import { ref } from 'vue'

// 应用状态管理
export const useAppStore = defineStore('app', () => {
  // 应用标题
  const title = ref('重命名工具')

  // 应用版本
  const version = ref('1.0.0')

  // 设置应用标题
  const setTitle = (newTitle) => {
    title.value = newTitle
  }

  // 设置应用版本
  const setVersion = (newVersion) => {
    version.value = newVersion
  }

  return {
    title,
    version,
    setTitle,
    setVersion
  }
})
