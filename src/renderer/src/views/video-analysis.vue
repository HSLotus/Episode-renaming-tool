<template>
  <div class="video-analysis">
    <div class="header">
      <el-button @click="goBack">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        返回
      </el-button>
      <h1>视频分析结果</h1>
    </div>

    <div class="analysis-container">
      <!-- 分析进度 -->
      <div v-if="isAnalyzing" class="progress-section">
        <el-card>
          <h3>正在分析视频文件...</h3>
          <el-progress
            :percentage="analysisProgress.percentage"
            :status="analysisProgress.percentage === 100 ? 'success' : ''"
          />
          <p class="progress-text">
            {{ analysisProgress.current }} / {{ analysisProgress.total }} 个文件已完成
          </p>
        </el-card>
      </div>

      <!-- 分析结果 -->
      <div v-if="analysisResults.length > 0" class="results-section">
        <div class="results-header">
          <h3>分析完成 ({{ successCount }}/{{ analysisResults.length }})</h3>
          <el-button-group>
            <el-button size="small" @click="expandAll">展开全部</el-button>
            <el-button size="small" @click="collapseAll">折叠全部</el-button>
            <el-button size="small" type="primary" @click="exportResults">导出结果</el-button>
          </el-button-group>
        </div>

        <!-- 视频分析结果列表 -->
        <el-collapse v-model="activeCollapse" class="results-collapse">
          <el-collapse-item
            v-for="(result, index) in analysisResults"
            :key="index"
            :name="index.toString()"
            :class="{ 'error-item': !result.success }"
          >
            <template #title>
              <div class="collapse-title">
                <el-icon v-if="result.success" color="#67c23a">
                  <SuccessFilled />
                </el-icon>
                <el-icon v-else color="#f56c6c">
                  <CircleCloseFilled />
                </el-icon>
                <span class="file-name">{{
                  result.success ? result.data.fileName : result.fileName
                }}</span>
                <span v-if="result.success" class="file-info">
                  {{ result.data.video.resolution }} | {{ result.data.durationFormatted }}
                </span>
              </div>
            </template>

            <!-- 成功分析的结果 -->
            <div v-if="result.success" class="video-info">
              <el-row :gutter="20">
                <!-- 基本信息 -->
                <el-col :span="12">
                  <el-card header="基本信息" class="info-card">
                    <div class="info-item">
                      <span class="label">文件名:</span>
                      <span class="value">{{ result.data.fileName }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">文件大小:</span>
                      <span class="value">{{ result.data.fileSizeFormatted }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">格式:</span>
                      <span class="value">{{ result.data.format }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">时长:</span>
                      <span class="value">{{ result.data.durationFormatted }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">总比特率:</span>
                      <span class="value">{{ result.data.bitRateFormatted }}</span>
                    </div>
                  </el-card>
                </el-col>

                <!-- 视频信息 -->
                <el-col :span="12">
                  <el-card header="视频信息" class="info-card">
                    <div class="info-item">
                      <span class="label">编码:</span>
                      <span class="value">{{ result.data.video.codec }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">分辨率:</span>
                      <span class="value">{{ result.data.video.resolution }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">帧率:</span>
                      <span class="value">{{ result.data.video.frameRateFormatted }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">宽高比:</span>
                      <span class="value">{{ result.data.video.aspectRatio }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">视频比特率:</span>
                      <span class="value">{{ result.data.video.bitRateFormatted }}</span>
                    </div>
                  </el-card>
                </el-col>
              </el-row>

              <!-- 音频信息 -->
              <el-row v-if="result.data.audio.length > 0" :gutter="20" style="margin-top: 20px">
                <el-col :span="24">
                  <el-card header="音频信息" class="info-card">
                    <div
                      v-for="(audio, audioIndex) in result.data.audio"
                      :key="audioIndex"
                      class="audio-track"
                    >
                      <h4>音轨 {{ audioIndex + 1 }}</h4>
                      <el-row :gutter="20">
                        <el-col :span="8">
                          <div class="info-item">
                            <span class="label">编码:</span>
                            <span class="value">{{ audio.codec }}</span>
                          </div>
                          <div class="info-item">
                            <span class="label">声道:</span>
                            <span class="value">{{ audio.channelsFormatted }}</span>
                          </div>
                        </el-col>
                        <el-col :span="8">
                          <div class="info-item">
                            <span class="label">采样率:</span>
                            <span class="value">{{ audio.sampleRateFormatted }}</span>
                          </div>
                          <div class="info-item">
                            <span class="label">比特率:</span>
                            <span class="value">{{ audio.bitRateFormatted }}</span>
                          </div>
                        </el-col>
                        <el-col :span="8">
                          <div class="info-item">
                            <span class="label">语言:</span>
                            <span class="value">{{ audio.language }}</span>
                          </div>
                        </el-col>
                      </el-row>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>

            <!-- 分析失败的结果 -->
            <div v-else class="error-info">
              <el-alert
                :title="`分析失败: ${result.fileName}`"
                :description="result.error"
                type="error"
                show-icon
                :closable="false"
              />
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 空状态 -->
      <div v-if="!isAnalyzing && analysisResults.length === 0" class="empty-state">
        <el-empty description="暂无分析结果">
          <el-button type="primary" @click="goBack">返回上传文件</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useFilesStore } from '../stores/FilesStore'
import { analyzeVideoFile } from '../utils/videoAnalysis'

// 获取视频文件的MIME类型
const getVideoMimeType = (extension) => {
  const mimeTypes = {
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    m4v: 'video/x-m4v',
    webm: 'video/webm',
    '3gp': 'video/3gpp',
    ts: 'video/mp2t'
  }
  return mimeTypes[extension?.toLowerCase()] || 'video/mp4'
}

// 路由和状态管理
const router = useRouter()
const fileStore = useFilesStore()

// 响应式数据
const isAnalyzing = ref(false) // 是否正在分析
const analysisResults = ref([]) // 分析结果
const analysisProgress = ref({ current: 0, total: 0, percentage: 0 }) // 分析进度
const activeCollapse = ref([]) // 展开的折叠项

// 计算属性
const successCount = computed(() => {
  return analysisResults.value.filter((result) => result.success).length
})

// 返回上一页
const goBack = () => {
  router.push('/')
}

// 开始分析视频（顺序逐个处理，完成一个追加一条结果）
const startAnalysis = async () => {
  // 获取选中的文件
  const selectedFiles = fileStore.getSelectedFiles()
  if (selectedFiles.length === 0) {
    ElMessage.warning('没有选中的文件')
    goBack()
    return
  }

  isAnalyzing.value = true
  analysisResults.value = []
  analysisProgress.value = { current: 0, total: selectedFiles.length, percentage: 0 }
  activeCollapse.value = []

  try {
    // 创建File对象数组
    const files = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          // 从文件路径读取文件内容
          const fileBuffer = await window.api.readFile(file.raw.path)
          
          // 创建File对象
          const blob = new Blob([fileBuffer], { type: getVideoMimeType(file.extension) })
          const fileObj = new File([blob], file.name, {
            type: getVideoMimeType(file.extension),
            lastModified: file.raw.lastModified ? new Date(file.raw.lastModified).getTime() : Date.now()
          })
          
          return fileObj
        } catch (error) {
          console.error(`读取文件失败: ${file.path}`, error)
          throw new Error(`无法读取文件: ${file.name}`)
        }
      })
    )
    
    console.log('准备分析的文件:', files)
    
    for (let i = 0; i < files.length; i++) {
      try {
        const data = await analyzeVideoFile(files[i])
        analysisResults.value.push({ success: true, data })

        // 第一次成功结果时默认展开当前项
        if (activeCollapse.value.length === 0) {
          activeCollapse.value = [i.toString()]
        }
      } catch (error) {
        analysisResults.value.push({
          success: false,
          error: error.message,
          fileName: selectedFiles[i]?.name || '未知文件'
        })
      }

      // 更新进度
      analysisProgress.value = {
        current: i + 1,
        total: files.length,
        percentage: Math.round(((i + 1) / files.length) * 100)
      }
    }

    ElMessage.success(
      `分析完成！成功 ${successCount.value} 个，失败 ${analysisResults.value.length - successCount.value} 个`
    )
  } catch (error) {
    ElMessage.error(`分析过程中出现错误: ${error.message}`)
  } finally {
    isAnalyzing.value = false
  }
}

// 展开全部
const expandAll = () => {
  activeCollapse.value = analysisResults.value.map((_, index) => index.toString())
}

// 折叠全部
const collapseAll = () => {
  activeCollapse.value = []
}

// 导出结果
const exportResults = () => {
  const successResults = analysisResults.value.filter((result) => result.success)

  if (successResults.length === 0) {
    ElMessage.warning('没有成功的分析结果可导出')
    return
  }

  // 生成导出数据
  const exportData = successResults.map((result) => ({
    文件名: result.data.fileName,
    文件大小: result.data.fileSizeFormatted,
    格式: result.data.format,
    时长: result.data.durationFormatted,
    分辨率: result.data.video.resolution,
    视频编码: result.data.video.codec,
    帧率: result.data.video.frameRateFormatted,
    视频比特率: result.data.video.bitRateFormatted,
    音频编码: result.data.audio[0]?.codec || '无',
    音频声道: result.data.audio[0]?.channelsFormatted || '无',
    音频采样率: result.data.audio[0]?.sampleRateFormatted || '无'
  }))

  // 转换为CSV格式
  const csvContent = [
    Object.keys(exportData[0]).join(','),
    ...exportData.map((row) => Object.values(row).join(','))
  ].join('\n')

  // 下载文件
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `视频分析结果_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()

  ElMessage.success('分析结果已导出')
}

// 组件挂载时开始分析
onMounted(() => {
  startAnalysis()
})
</script>

<style scoped>
.video-analysis {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 500;
}

.analysis-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-text {
  margin-top: 10px;
  text-align: center;
  color: #606266;
}

.results-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.results-header h3 {
  margin: 0;
  color: #303133;
}

.results-collapse {
  border: none;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.file-name {
  font-weight: 500;
  color: #303133;
}

.file-info {
  margin-left: auto;
  color: #909399;
  font-size: 14px;
}

.error-item {
  border-left: 3px solid #f56c6c;
}

.video-info {
  padding: 20px 0;
}

.info-card {
  height: 100%;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.value {
  color: #303133;
  text-align: right;
  word-break: break-all;
}

.audio-track {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.audio-track h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.error-info {
  padding: 20px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
</style>
