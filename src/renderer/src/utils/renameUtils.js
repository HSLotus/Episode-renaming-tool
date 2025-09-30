/**
 * 视频文件重命名工具函数
 */

// 知名压制组列表
export const encoderGroups = [
  'VCB-Studio',
  'Snow-Raws',
  'BeanSub',
  'SweetSub',
  'LoliHouse',
  'ANi',
  'Nekomoe kissaten',
  'DMG',
  'Lilith-Raws',
  'NC-Raws',
  'EME',
  'Skymoon-Raws',
  '桜都字幕组',
  '极影字幕社',
  '幻樱字幕组',
  '喵萌奶茶屋',
  '千夏字幕组',
  '风车字幕组',
  '动漫国字幕组',
  '诸神字幕组'
]

// 知名字幕组列表
export const subtitleGroups = [
  '桜都字幕组',
  '极影字幕社',
  '幻樱字幕组',
  '喵萌奶茶屋',
  '千夏字幕组',
  '风车字幕组',
  '动漫国字幕组',
  '诸神字幕组',
  '澄空学园',
  '华盟字幕社',
  '爱恋字幕社',
  '雪飘工作室',
  '悠哈C9字幕社',
  '白恋字幕组',
  '天使动漫论坛',
  '星空字幕组',
  '异域字幕组',
  '轻之国度',
  'HKG字幕组',
  'WOLF字幕组'
]

// 分辨率选项
export const resolutionOptions = [
  { label: '360p', value: '360p' },
  { label: '480p', value: '480p' },
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
  { label: '2K', value: '2k' },
  { label: '4K', value: '4k' }
]

// 来源选项
export const sourceOptions = [
  { label: '无', value: '' },
  { label: 'BDZip', value: 'BDZip' },
  { label: 'WebZip', value: 'WebZip' }
]

/**
 * 生成重命名文件名
 * @param {Object} formData - 表单数据
 * @param {Object} file - 文件对象
 * @param {number} episodeIndex - 集数索引（从0开始）
 * @returns {string} 生成的文件名
 */
export function generateFileName(formData, file, episodeIndex = 0) {
  const parts = []

  // 压制组&&字幕组
  const encoderGroup = formData.encoderGroup
  const subtitleGroup = formData.subtitleGroup

  if (encoderGroup && subtitleGroup && encoderGroup !== subtitleGroup) {
    parts.push(`[${encoderGroup}&&${subtitleGroup}]`)
  } else if (encoderGroup) {
    parts.push(`[${encoderGroup}]`)
  } else if (subtitleGroup) {
    parts.push(`[${subtitleGroup}]`)
  } else {
    parts.push('[个人收集]')
  }

  // 作品名（必填）
  if (formData.workName) {
    parts.push(`[${formData.workName}]`)
  }

  // 作品别名（选填）
  if (formData.workAlias) {
    parts.push(`[${formData.workAlias}]`)
  }

  // 作品年份（选填）
  if (formData.workYear) {
    parts.push(`[${formData.workYear}]`)
  }

  // 分辨率（必填）
  if (formData.resolution) {
    parts.push(`[${formData.resolution}]`)
  }

  // 集数
  if (formData.season && formData.startEpisode) {
    const episodeNumber = parseInt(formData.startEpisode) + episodeIndex
    parts.push(
      `[S${formData.season.toString().padStart(2, '0')}E${episodeNumber.toString().padStart(2, '0')}]`
    )
  }

  // 视频格式（选填）
  if (formData.videoFormat) {
    parts.push(`[${formData.videoFormat}]`)
  }

  // 音频格式（选填）
  if (formData.audioFormat) {
    parts.push(`[${formData.audioFormat}]`)
  }

  // 来源（选填）
  if (formData.source) {
    parts.push(`[${formData.source}]`)
  }

  // 获取原文件扩展名
  const originalName = file.name
  const lastDotIndex = originalName.lastIndexOf('.')
  const extension = lastDotIndex > -1 ? originalName.substring(lastDotIndex) : ''

  // 组合文件名
  const fileName = parts.join('') + extension

  return fileName
}

/**
 * 批量生成重命名文件名列表
 * @param {Object} formData - 表单数据
 * @param {Array} files - 文件列表
 * @returns {Array} 重命名后的文件名列表
 */
export function generateFileNames(formData, files) {
  return files.map((file, index) => ({
    originalName: file.name,
    newName: generateFileName(formData, file, index),
    file: file
  }))
}

/**
 * 验证表单数据
 * @param {Object} formData - 表单数据
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
 */
export function validateFormData(formData) {
  const errors = []

  // 验证必填字段
  if (!formData.workName || formData.workName.trim() === '') {
    errors.push('作品名不能为空')
  }

  if (!formData.resolution) {
    errors.push('请选择分辨率')
  }

  if (!formData.season || formData.season === '') {
    errors.push('请输入季数')
  }

  if (!formData.startEpisode || formData.startEpisode === '') {
    errors.push('请输入起始集数')
  }

  // 验证数字字段
  if (
    formData.workYear &&
    (isNaN(formData.workYear) || formData.workYear < 1900 || formData.workYear > 2100)
  ) {
    errors.push('作品年份必须是1900-2100之间的数字')
  }

  if (formData.season && (isNaN(formData.season) || formData.season < 1)) {
    errors.push('季数必须是大于0的数字')
  }

  if (formData.startEpisode && (isNaN(formData.startEpisode) || formData.startEpisode < 1)) {
    errors.push('起始集数必须是大于0的数字')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 获取文件扩展名
 * @param {string} fileName - 文件名
 * @returns {string} 扩展名
 */
export function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf('.')
  return lastDotIndex > -1 ? fileName.substring(lastDotIndex) : ''
}
