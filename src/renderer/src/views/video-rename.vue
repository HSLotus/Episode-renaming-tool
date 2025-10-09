<template>
  <div class="video-rename-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <el-button type="text" :icon="ArrowLeft" class="back-button" @click="handleBack">
          返回首页
        </el-button>
        <h3>视频文件重命名</h3>
        <el-button
          type="primary"
          size="small"
          :loading="isAutoFilling"
          :disabled="selectedFiles.length === 0"
          @click="handleAutoFill"
        >
          <el-icon><VideoCamera /></el-icon>
          自动填入
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 重命名表单 -->
      <div class="form-section">
        <RenameForm
          ref="renameFormRef"
          :show-movie-checkbox="selectedFiles.length === 1"
          @update:form-data="handleFormDataUpdate"
        />
      </div>

      <!-- 文件列表预览 -->
      <div class="list-section">
        <FileRenameList
          ref="fileListRef"
          :files="selectedFiles"
          :rename-data="fileStore.getAllRenameData()"
          @rename="handleRename"
          @rename-complete="handleRenameComplete"
        />
      </div>
    </div>

    <!-- 重命名进度对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      title="重命名进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="progress-content">
        <el-progress :percentage="progressPercentage" :status="progressStatus" :stroke-width="8" />
        <p class="progress-text">
          {{ progressText }}
        </p>
        <div v-if="progressDetails" class="progress-details">
          <el-text size="small" type="info">
            {{ progressDetails }}
          </el-text>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, VideoCamera } from '@element-plus/icons-vue'
import RenameForm from '../components/RenameForm.vue'
import FileRenameList from '../components/FileRenameList.vue'
import { useFilesStore } from '../stores/FilesStore'
import { analyzeVideosForAutoFill } from '../utils/autoFillUtils'

// 路由和状态管理
const router = useRouter()
const fileStore = useFilesStore()

// 组件引用
const renameFormRef = ref()
const fileListRef = ref()

// 响应式数据
const formData = reactive({})
const showProgressDialog = ref(false)
const progressPercentage = ref(0)
const progressStatus = ref('')
const progressText = ref('')
const progressDetails = ref('')
const isAutoFilling = ref(false) // 自动填入加载状态

// 计算属性：选中的文件
const selectedFiles = computed(() => {
  return fileStore.getSelectedFiles()
})

// 表单数据更新处理
const handleFormDataUpdate = (data) => {
  Object.assign(formData, data)
  // 更新store中所有文件的重命名数据
  fileStore.updateAllFilesRenameData(data)

  // 为所有文件重新生成新文件名
  selectedFiles.value.forEach((file) => {
    fileStore.generateNewFileName(file.id)
  })
}

// 返回首页
const handleBack = () => {
  // 清空选中的文件列表
  fileStore.selectedFileIds = []
  router.push('/')
}

// 自动填入视频信息处理
const handleAutoFill = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('没有选中的文件')
    return
  }

  try {
    isAutoFilling.value = true
    ElMessage.info('正在分析视频文件，请稍候...')

    // 分析第一个视频文件
    const result = await analyzeVideosForAutoFill(selectedFiles.value)

    if (result.success) {
      // 更新表单数据
      renameFormRef.value?.updateFormData(result.data)

      ElMessage.success(
        `自动填入成功！分辨率: ${result.data.resolution || '未知'}，视频格式: ${result.data.videoFormat || '未知'}，音频格式: ${result.data.audioFormat || '未知'}`
      )
    } else {
      ElMessage.error(`自动填入失败: ${result.error}`)
    }
  } catch (error) {
    console.error('自动填入过程中出现错误:', error)
    ElMessage.error(`自动填入失败: ${error.message}`)
  } finally {
    isAutoFilling.value = false
  }
}

// 重命名处理
const handleRename = async ({ files, renameData }) => {
  try {
    showProgressDialog.value = true
    progressPercentage.value = 0
    progressStatus.value = ''
    progressText.value = '开始重命名文件...'
    progressDetails.value = ''

    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const renameInfo = renameData.find((data) => data.fileId === file.id)
      const newName = renameInfo ? renameInfo.newFileName : file.name

      try {
        // 更新进度
        progressPercentage.value = Math.round(((i + 1) / files.length) * 100)
        progressText.value = `正在重命名: ${file.name}`
        progressDetails.value = `新名称: ${newName}`

        // 构建文件路径 - 使用File对象的完整路径
        let oldPath

        // 对于通过input选择的文件，使用File对象的path属性（如果存在）
        if (file.raw && file.raw.path) {
          oldPath = file.raw.path
        } else if (file.raw && file.raw.webkitRelativePath) {
          // 对于文件夹上传，使用webkitRelativePath
          oldPath = file.raw.webkitRelativePath
        } else {
          // 如果没有完整路径，则无法重命名
          throw new Error(`无法获取文件完整路径: ${file.name}`)
        }

        // 获取文件所在目录
        const lastSlashIndex =
          oldPath.lastIndexOf('\\') !== -1 ? oldPath.lastIndexOf('\\') : oldPath.lastIndexOf('/')
        const directory = lastSlashIndex !== -1 ? oldPath.substring(0, lastSlashIndex + 1) : ''
        const newPath = directory + newName

        // 调用 Electron API 进行文件重命名
        const result = await window.api.renameFile(oldPath, newPath)

        if (result.success) {
          results.push({
            index: i,
            status: 'success',
            originalName: file.name,
            newName: newName
          })

          // 更新文件列表状态
          fileListRef.value?.updateRenameResult(i, 'success')

          // 更新 FilesStore 中的文件信息
          fileStore.updateFileInfo(file.id, newName, newPath)
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        results.push({
          index: i,
          status: 'error',
          originalName: file.name,
          newName: newName,
          error: error.message
        })

        fileListRef.value?.updateRenameResult(i, 'error', error.message)
      }
    }

    // 完成重命名
    progressStatus.value = 'success'
    progressText.value = '重命名完成！'
    progressDetails.value = `成功: ${results.filter((r) => r.status === 'success').length} 个，失败: ${results.filter((r) => r.status === 'error').length} 个`

    // 延迟关闭对话框
    setTimeout(() => {
      showProgressDialog.value = false
      handleRenameComplete(results)
    }, 2000)
  } catch (error) {
    progressStatus.value = 'exception'
    progressText.value = '重命名失败'
    progressDetails.value = error.message

    setTimeout(() => {
      showProgressDialog.value = false
      ElMessage.error(`重命名失败: ${error.message}`)
    }, 2000)
  }
}

// 重命名完成处理
const handleRenameComplete = (results) => {
  const successCount = results.filter((r) => r.status === 'success').length
  const failCount = results.filter((r) => r.status === 'error').length

  if (failCount === 0) {
    ElMessage.success(`重命名完成！成功处理 ${successCount} 个文件`)
  } else {
    ElMessage.warning(`重命名完成！成功 ${successCount} 个，失败 ${failCount} 个`)
  }

  // 重置文件列表状态
  fileListRef.value?.resetStatus()
}

// 页面挂载时检查文件
onMounted(() => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('没有选中的文件，请返回首页选择文件')
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } else {
    // 初始化新文件名
    selectedFiles.value.forEach((file) => {
      fileStore.generateNewFileName(file.id)
    })

    // 调用自动填入
    handleAutoFill()
  }
})
</script>

<style scoped>
.video-rename-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  font-size: 14px;
  color: #606266;
  margin-top: 3px;
}

.back-button:hover {
  color: #409eff;
}

.header-content h1 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.file-info-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-header {
  padding: 16px 24px 0 24px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.form-header .el-button {
  margin-bottom: 16px;
}

.list-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-content {
  text-align: center;
  padding: 20px 0;
}

.progress-text {
  margin: 16px 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.progress-details {
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
    gap: 16px;
  }

  .header-content {
    padding: 12px 16px;
  }

  .header-content h1 {
    font-size: 18px;
  }
}
</style>
