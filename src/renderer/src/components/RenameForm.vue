<template>
  <div class="rename-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="small"
      class="form-container"
    >
      <div class="left">
        <!-- 压制组&&字幕组 -->
        <el-form-item label="压制组&&字幕组">
          <div class="group-selectors">
            <!-- 压制组 -->
            <div class="selector-item">
              <el-input
                v-if="formData.encoderGroupCustom"
                v-model="formData.encoderGroup"
                placeholder="输入自定义压制组"
                style="width: 200px"
              />
              <el-select
                v-else
                v-model="formData.encoderGroup"
                placeholder="选择压制组"
                clearable
                filterable
                :disabled="formData.encoderGroupCustom"
                style="width: 200px"
              >
                <el-option
                  v-for="group in encoderGroups"
                  :key="group"
                  :label="group"
                  :value="group"
                />
              </el-select>
              <el-checkbox v-model="formData.encoderGroupCustom" style="margin-left: 10px">
                自定义
              </el-checkbox>
            </div>

            <!-- 字幕组 -->
            <div class="selector-item">
              <el-input
                v-if="formData.subtitleGroupCustom"
                v-model="formData.subtitleGroup"
                placeholder="输入自定义字幕组"
                style="width: 200px"
              />
              <el-select
                v-else
                v-model="formData.subtitleGroup"
                placeholder="选择字幕组"
                clearable
                filterable
                :disabled="formData.subtitleGroupCustom"
                style="width: 200px"
              >
                <el-option
                  v-for="group in subtitleGroups"
                  :key="group"
                  :label="group"
                  :value="group"
                />
              </el-select>
              <el-checkbox v-model="formData.subtitleGroupCustom" style="margin-left: 10px">
                自定义
              </el-checkbox>
            </div>
          </div>
        </el-form-item>

        <!-- 作品名 -->
        <el-form-item label="作品名" prop="workName" required>
          <el-input v-model="formData.workName" placeholder="请输入作品名" style="width: 250px" />
        </el-form-item>

        <!-- 作品别名 -->
        <el-form-item label="作品别名">
          <el-input
            v-model="formData.workAlias"
            placeholder="选填，不输入则没有此项"
            style="width: 250px"
          />
        </el-form-item>

        <!-- 作品年份 -->
        <el-form-item label="作品年份">
          <el-date-picker
            v-model="formData.workYear"
            type="year"
            placeholder="选择年份"
            format="YYYY"
            value-format="YYYY"
            style="width: 200px"
          />
        </el-form-item>
      </div>
      <div class="right">
        <!-- 分辨率 -->
        <el-form-item label="分辨率" prop="resolution" required>
          <el-select v-model="formData.resolution" placeholder="请选择分辨率" style="width: 200px">
            <el-option
              v-for="option in resolutionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <!-- 集数 -->
        <el-form-item label="集数" :required="!formData.isMovie">
          <div class="episode-container">
            <div class="episode-inputs">
              <span>第</span>
              <el-input-number
                v-model="formData.season"
                :min="1"
                :max="99"
                :disabled="formData.isMovie"
                style="width: 80px"
              />
              <span>季 第</span>
              <el-input-number
                v-model="formData.startEpisode"
                :min="1"
                :max="999"
                :disabled="formData.isMovie"
                style="width: 80px"
              />
              <span>集</span>
              <el-checkbox v-if="props.showMovieCheckbox" v-model="formData.isMovie">
                电影
              </el-checkbox>
            </div>
          </div>
        </el-form-item>

        <!-- 视频格式 -->
        <el-form-item label="视频格式">
          <el-input
            v-model="formData.videoFormat"
            placeholder="选填，如 HEVC、AVC"
            style="width: 200px"
          />
        </el-form-item>

        <!-- 音频格式 -->
        <el-form-item label="音频格式">
          <el-input
            v-model="formData.audioFormat"
            placeholder="选填，如 AAC、FLAC"
            style="width: 200px"
          />
        </el-form-item>

        <!-- 来源 -->
        <el-form-item label="来源">
          <el-select v-model="formData.source" placeholder="选择来源" style="width: 200px">
            <el-option
              v-for="option in sourceOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import {
  encoderGroups,
  subtitleGroups,
  resolutionOptions,
  sourceOptions,
  validateFormData
} from '../utils/renameUtils'

// 组件属性
const props = defineProps({
  showMovieCheckbox: {
    type: Boolean,
    default: true
  }
})

// 表单引用
const formRef = ref()

// 表单数据
const formData = reactive({
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
  resolution: '1080p',

  // 集数信息
  season: 1,
  startEpisode: 1,
  isMovie: false, // 是否是电影

  // 格式信息
  videoFormat: '',
  audioFormat: '',
  source: ''
})

// 表单验证规则
const formRules = {
  workName: [{ required: true, message: '请输入作品名', trigger: 'blur' }],
  resolution: [{ required: true, message: '请选择分辨率', trigger: 'change' }]
}

// 监听表单数据变化，向父组件发送更新
const emit = defineEmits(['update:formData'])

watch(
  () => formData,
  (newData) => {
    emit('update:formData', { ...newData })
  },
  { deep: true }
)

// 暴露表单验证方法
const validateForm = () => {
  return formRef.value.validate()
}

// 暴露表单数据
const getFormData = () => {
  return { ...formData }
}

// 暴露验证方法
const validate = () => {
  return validateFormData(formData)
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    encoderGroup: '',
    encoderGroupCustom: false,
    subtitleGroup: '',
    subtitleGroupCustom: false,
    workName: '',
    workAlias: '',
    workYear: null,
    resolution: '',
    season: 1,
    startEpisode: 1,
    videoFormat: '',
    audioFormat: '',
    source: ''
  })
  formRef.value?.clearValidate()
}

// 监听自定义选项变化，清空对应输入
watch(
  () => formData.encoderGroupCustom,
  (newVal) => {
    if (newVal) {
      formData.encoderGroup = ''
    }
  }
)

watch(
  () => formData.subtitleGroupCustom,
  (newVal) => {
    if (newVal) {
      formData.subtitleGroup = ''
    }
  }
)

// 更新表单数据方法（用于自动填入）
const updateFormData = (data) => {
  Object.keys(data).forEach((key) => {
    if (key in formData) {
      formData[key] = data[key]
    }
  })
}

// 暴露方法给父组件
defineExpose({
  validateForm,
  getFormData,
  validate,
  resetForm,
  updateFormData
})
</script>

<style scoped>
.form-container {
  width: 100%;
  display: flex;
}

.left,
.right {
  min-width: 420px;
  flex: 1;
}

.el-form-item--small {
  margin-bottom: 10px !important;
}
.el-form-item--small:last-child {
  margin-bottom: 0px !important;
}

.rename-form {
  background-color: #fff;
  padding: 10px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.group-selectors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selector-item {
  display: flex;
  align-items: center;
}

.episode-container {
  display: flex;
  flex-direction: column;
}

.episode-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.episode-inputs span {
  color: #606266;
  font-size: 14px;
}
@media screen and (max-width: 900px) {
  .form-container {
    flex-wrap: wrap;
  }
  .right {
    margin-top: 10px;
  }
}
</style>
