<template>
  <div class="file-rename-list">
    <div class="list-header">
      <h3>文件重命名预览</h3>
      <span class="file-count">共 {{ fileList.length }} 个文件</span>
      <el-button
        type="primary"
        size="small"
        :loading="isRenaming"
        :disabled="!canRename"
        style="margin-left: auto"
        @click="handleRename"
      >
        {{ isRenaming ? '重命名中...' : '开始重命名' }}
      </el-button>
    </div>

    <div class="list-content">
      <el-table :data="fileList" stripe border height="400" style="width: 100%">
        <el-table-column prop="originalName" label="原文件名" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="file-name">
              <el-icon class="file-icon">
                <VideoPlay />
              </el-icon>
              <span>{{ row.originalName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="newName" label="新文件名" min-width="300" show-overflow-tooltip>
          <template #header>
            <div class="column-header">
              <span>新文件名</span>
              <el-button
                :icon="isLocked ? Lock : Unlock"
                size="small"
                type="text"
                class="lock-button"
                :title="isLocked ? '点击解锁编辑' : '点击锁定编辑'"
                @click="toggleLock"
              />
            </div>
          </template>
          <template #default="{ row }">
            <div class="file-name">
              <el-icon class="file-icon">
                <VideoPlay />
              </el-icon>
              <!-- 可编辑的文件名输入框 -->
              <el-input
                v-model="row.newName"
                size="small"
                class="file-name-input"
                :class="{ 'locked-input': isLocked }"
                :disabled="isLocked"
                placeholder="请输入新文件名"
                @blur="handleFileNameChange(row.fileId, row.newName)"
                @keyup.enter="handleFileNameChange(row.fileId, row.newName)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.originalName === row.newName ? 'success' : 'info'" size="small">
              {{ row.originalName === row.newName ? '已重命名' : '待重命名' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Lock, Unlock } from '@element-plus/icons-vue'
import { useFilesStore } from '../stores/FilesStore'

// 获取文件store实例
const filesStore = useFilesStore()

// 组件属性
const props = defineProps({
  // 文件列表
  files: {
    type: Array,
    default: () => []
  },
  // 重命名数据
  renameData: {
    type: Array,
    default: () => []
  }
})

// 组件事件
const emit = defineEmits(['rename', 'rename-complete'])

// 响应式数据
const isRenaming = ref(false)
const renameResults = ref([])
// 锁定状态管理
const isLocked = ref(true)

// 切换锁定状态
const toggleLock = () => {
  isLocked.value = !isLocked.value
  ElMessage.info(isLocked.value ? '已锁定编辑' : '已解锁编辑')
}

// 计算属性：文件列表
const fileList = computed(() => {
  if (props.renameData.length === 0) {
    return []
  }

  return props.files.map((file) => {
    const renameInfo = props.renameData.find((data) => data.fileId === file.id)
    return {
      originalName: file.name,
      newName: renameInfo ? renameInfo.newFileName : file.name,
      fileId: file.id,
      status: 'pending'
    }
  })
})

// 计算属性：是否可以重命名
const canRename = computed(() => {
  if (props.files.length === 0 || props.renameData.length === 0) return false

  // 检查是否有必填字段
  return props.renameData.some((data) => data.workName && data.resolution)
})

// 处理文件名修改
const handleFileNameChange = (fileId, newFileName) => {
  // 验证文件名是否为空
  if (!newFileName || newFileName.trim() === '') {
    ElMessage.warning('文件名不能为空')
    return
  }

  // 验证文件名格式（可选：添加更多验证规则）
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(newFileName)) {
    ElMessage.warning('文件名包含非法字符，请修改')
    return
  }

  try {
    // 更新store中的重命名数据
    const renameData = filesStore.getFileRenameData(fileId)
    if (renameData) {
      // 直接更新newFileName字段
      renameData.newFileName = newFileName.trim()

      // 触发store的更新方法（如果需要的话）
      filesStore.updateFileRenameData(fileId, 'newFileName', newFileName.trim())

      ElMessage.success('文件名已更新')
    } else {
      ElMessage.error('未找到对应的文件数据')
    }
  } catch (error) {
    console.error('更新文件名失败:', error)
    ElMessage.error('更新文件名失败，请重试')
  }
}

// 处理重命名
const handleRename = async () => {
  if (!canRename.value) {
    ElMessage.warning('请完善表单信息后再进行重命名')
    return
  }

  try {
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要重命名 ${props.files.length} 个文件吗？此操作不可撤销。`,
      '确认重命名',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isRenaming.value = true
    renameResults.value = []

    // 发送重命名事件给父组件
    emit('rename', {
      files: props.files,
      renameData: props.renameData,
      fileList: fileList.value
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重命名操作被取消')
    }
  }
}

// 更新重命名结果
const updateRenameResult = (index, status, error = null) => {
  const existingIndex = renameResults.value.findIndex((r) => r.index === index)
  const result = {
    index,
    status,
    error
  }

  if (existingIndex >= 0) {
    renameResults.value[existingIndex] = result
  } else {
    renameResults.value.push(result)
  }
}

// 完成重命名
const completeRename = (results) => {
  isRenaming.value = false
  renameResults.value = results

  const successCount = results.filter((r) => r.status === 'success').length
  const failCount = results.filter((r) => r.status === 'error').length

  if (failCount === 0) {
    ElMessage.success(`重命名完成！成功处理 ${successCount} 个文件`)
  } else {
    ElMessage.warning(`重命名完成！成功 ${successCount} 个，失败 ${failCount} 个`)
  }

  emit('rename-complete', results)
}

// 重置状态
const resetStatus = () => {
  isRenaming.value = false
  renameResults.value = []
}

// 暴露方法给父组件
defineExpose({
  updateRenameResult,
  completeRename,
  resetStatus
})
</script>

<style scoped>
.file-rename-list {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.list-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.file-count {
  color: #909399;
  font-size: 14px;
}

.list-content {
  padding: 0;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #409eff;
  font-size: 16px;
}

/* 文件名输入框样式 */
.file-name-input {
  flex: 1;
}

.file-name-input :deep(.el-input__wrapper) {
  border: 1px solid transparent;
  background-color: transparent;
  box-shadow: none;
  transition: all 0.2s ease;
}

.file-name-input :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
  background-color: #fff;
}

.file-name-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 0;
}

:deep(.el-table__header) {
  background-color: #f5f7fa;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
}

/* 列表头样式 */
.column-header {
  display: flex;
  width: 100%;
}

/* 锁定按钮样式 */
.lock-button {
  padding: 4px;
  margin-left: 8px;
  color: #606266;
  transition: all 0.2s ease;
}

.lock-button:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

.lock-button:active {
  transform: scale(0.95);
}

/* 锁定状态下的输入框样式 */
.locked-input :deep(.el-input__wrapper) {
  background-color: #f5f7fa !important;
  border-color: #dcdfe6 !important;
  cursor: not-allowed;
}

.locked-input :deep(.el-input__inner) {
  color: #909399 !important;
  cursor: not-allowed;
}

.locked-input :deep(.el-input__wrapper:hover) {
  border-color: #dcdfe6 !important;
  background-color: #f5f7fa !important;
}
</style>
