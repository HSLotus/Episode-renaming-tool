<template>
  <div class="home-container">
    <div class="header">
      <h1>视频处理工具</h1>
    </div>

    <div class="main-content">
      <FileUploader />

      <!-- 操作按钮区域 -->
      <div v-if="fileStore.totalCount > 0" class="action-section">
        <div class="button-group">
          <el-button
            type="primary"
            size="large"
            :disabled="fileStore.selectedCount === 0"
            @click="handleStartAnalysis"
          >
            开始分析 ({{ fileStore.selectedCount }}/{{ fileStore.totalCount }})
          </el-button>

          <el-button
            type="success"
            size="large"
            :disabled="fileStore.selectedCount === 0"
            @click="handleStartRename"
          >
            文件重命名 ({{ fileStore.selectedCount }})
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import FileUploader from '../components/FileUploader.vue'
import { useFilesStore } from '../stores/FilesStore'

// 路由和状态管理
const router = useRouter()
const fileStore = useFilesStore()

// 开始分析按钮点击处理
const handleStartAnalysis = () => {
  if (fileStore.selectedCount === 0) {
    ElMessage.warning('请先选择要分析的视频文件')
    return
  }

  // 跳转到视频分析页面
  router.push('/video-analysis')
}

// 开始重命名按钮点击处理
const handleStartRename = () => {
  if (fileStore.selectedCount === 0) {
    ElMessage.warning('请先选择要重命名的视频文件')
    return
  }

  // 跳转到视频重命名页面
  router.push('/video-rename')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 500;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.action-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}
</style>
