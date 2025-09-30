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
          <template #default="{ row }">
            <div class="file-name">
              <el-icon class="file-icon">
                <VideoPlay />
              </el-icon>
              <span>{{ row.newName }}</span>
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
import { VideoPlay } from '@element-plus/icons-vue'
import { generateFileNames, validateFormData } from '../utils/renameUtils'

// 组件属性
const props = defineProps({
  // 文件列表
  files: {
    type: Array,
    default: () => []
  },
  // 表单数据
  formData: {
    type: Object,
    default: () => ({})
  }
})

// 组件事件
const emit = defineEmits(['rename', 'rename-complete'])

// 响应式数据
const isRenaming = ref(false)
const renameResults = ref([])

// 计算属性：文件列表
const fileList = computed(() => {
  if (!props.formData.workName || !props.formData.resolution) {
    return []
  }

  const results = generateFileNames(props.formData, props.files)

  // 合并重命名结果状态
  return results.map((item, index) => {
    const existingResult = renameResults.value.find((r) => r.index === index)
    return {
      ...item,
      status: existingResult ? existingResult.status : 'pending'
    }
  })
})

// 计算属性：是否可以重命名
const canRename = computed(() => {
  if (props.files.length === 0) return false

  const validation = validateFormData(props.formData)
  return validation.isValid
})

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
      formData: props.formData,
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
</style>
