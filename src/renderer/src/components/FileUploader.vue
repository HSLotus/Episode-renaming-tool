<template>
  <div class="file-uploader">
    <!-- 文件选择区域 -->
    <el-card style="margin-bottom: 10px">
      <div class="upload-section">
        <h4>文件上传器</h4>
        <el-button type="primary" :loading="isSelecting" @click="handleSelectFiles">
          <el-icon>
            <FolderOpened />
          </el-icon>
          选择文件
        </el-button>
      </div>
    </el-card>

    <!-- 文件列表区域 -->
    <div v-if="fileStore.totalFiles > 0">
      <el-card>
        <template #header>
          <div class="list-header">
            <div class="header-left">
              <h4>
                文件列表 ({{ fileStore.totalFiles }}) | 已选中 {{ fileStore.selectedCount }} 个文件
              </h4>
            </div>
            <div class="header-right">
              <el-button-group size="small">
                <el-button
                  :disabled="fileStore.selectedCount === 0"
                  type="primary"
                  @click="handleGoToAnalysis"
                >
                  <el-icon>
                    <DataAnalysis />
                  </el-icon>
                  视频分析
                </el-button>
                <el-button
                  :disabled="fileStore.selectedCount === 0"
                  type="success"
                  @click="handleGoToRename"
                >
                  <el-icon>
                    <Edit />
                  </el-icon>
                  批量重命名
                </el-button>
                <el-button type="danger" @click="handleClearFiles">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  清空列表
                </el-button>
              </el-button-group>
            </div>
          </div>
        </template>

        <!-- 可拖拽排序的文件表格 -->
        <el-table
          ref="fileTableRef"
          :data="fileStore.files"
          stripe
          height="400px"
          row-key="id"
          @selection-change="handleSelectionChange"
        >
          <!-- 选择列 -->
          <el-table-column type="selection" width="55" />

          <!-- 文件名列 -->
          <el-table-column prop="name" label="文件名" min-width="200">
            <template #default="{ row }">
              <div class="file-name-cell">
                <el-icon class="file-icon">
                  <VideoPlay />
                </el-icon>
                <span class="file-name" :title="row.name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 文件路径列 -->
          <el-table-column prop="path" label="文件路径" min-width="300">
            <template #default="{ row }">
              <el-text class="file-path" :title="row.path" truncated>
                {{ row.path }}
              </el-text>
            </template>
          </el-table-column>

          <!-- 文件扩展名列 -->
          <el-table-column prop="extension" label="格式" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.extension.toUpperCase() }}</el-tag>
            </template>
          </el-table-column>

          <!-- 文件大小列 -->
          <el-table-column prop="size" label="文件大小" width="120" align="center">
            <template #default="{ row }">
              <el-text size="small">{{ formatFileSize(row.size) }}</el-text>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                plain
                :icon="Delete"
                @click="handleRemoveFile(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { FolderOpened, VideoPlay, Delete, DataAnalysis, Edit } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { useFilesStore } from '../stores/FilesStore'

// 路由和状态管理
const router = useRouter()
const fileStore = useFilesStore()

// 响应式数据
const isSelecting = ref(false) // 是否正在选择文件
const fileTableRef = ref() // 表格引用
let sortableInstance = null // 拖拽实例

// 选择文件处理
const handleSelectFiles = async () => {
  try {
    isSelecting.value = true

    // 调用 Electron API 打开文件选择对话框
    const result = await window.api.openFileDialog()

    if (result.success) {
      if (result.files && result.files.length > 0) {
        // 添加文件到store（返回实际添加的文件）
        const addedFiles = fileStore.addFiles(result.files)

        // 初始化拖拽功能
        nextTick(() => {
          initSortable()
        })

        if (addedFiles.length > 0) {
          ElMessage.success(`成功添加 ${addedFiles.length} 个文件`)
        } else {
          ElMessage.info('所有文件都已存在，未添加新文件')
        }
      } else {
        ElMessage.info('未选择任何文件')
      }
    } else {
      if (result.message !== '用户取消选择') {
        ElMessage.error(result.error || '文件选择失败')
      }
    }
  } catch (error) {
    ElMessage.error(`文件选择失败: ${error.message}`)
  } finally {
    isSelecting.value = false
  }
}

// 清空文件列表
const handleClearFiles = () => {
  fileStore.clearFiles()
  destroySortable()
  ElMessage.success('文件列表已清空')
}

// 删除单个文件
const handleRemoveFile = (fileId) => {
  fileStore.removeFile(fileId)
  ElMessage.success('文件已删除')

  // 如果没有文件了，销毁拖拽实例
  if (fileStore.totalFiles === 0) {
    destroySortable()
  }
}

// 表格选择变化处理
const handleSelectionChange = (selection) => {
  const selectedIds = selection.map((file) => file.id)
  fileStore.selectedFileIds = selectedIds
}

// 跳转到视频分析页面
const handleGoToAnalysis = () => {
  if (fileStore.selectedCount === 0) {
    ElMessage.warning('请先选择要分析的文件')
    return
  }
  router.push('/video-analysis')
}

// 跳转到重命名页面
const handleGoToRename = () => {
  if (fileStore.selectedCount === 0) {
    ElMessage.warning('请先选择要重命名的文件')
    return
  }
  router.push('/video-rename')
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 初始化拖拽排序功能
const initSortable = () => {
  nextTick(() => {
    const tbody = fileTableRef.value?.$el.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) {
      console.warn('tbody 不存在，拖拽初始化失败')
      return
    }

    // 销毁旧实例
    destroySortable()

    // 创建新的拖拽实例
    sortableInstance = Sortable.create(tbody, {
      animation: 150,
      onEnd: (evt) => {
        // 更新文件顺序
        const newFiles = [...fileStore.files]
        const movedItem = newFiles.splice(evt.oldIndex, 1)[0]
        newFiles.splice(evt.newIndex, 0, movedItem)

        // 更新store中的文件顺序
        fileStore.updateFileOrder(newFiles)

        console.log('文件排序已更新')
      }
    })
  })
}

// 销毁拖拽实例
const destroySortable = () => {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
}

// 组件挂载时初始化
onMounted(() => {
  if (fileStore.totalFiles > 0) {
    nextTick(() => {
      initSortable()
    })
  }
})
</script>

<style scoped>
.file-uploader {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #409eff;
  flex-shrink: 0;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-path {
  max-width: 100%;
}

.action-section {
  position: sticky;
  bottom: 30px;
  z-index: 10;
}

.action-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-uploader {
    padding: 16px;
  }

  .action-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .action-buttons {
    width: 100%;
    justify-content: center;
  }

  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
