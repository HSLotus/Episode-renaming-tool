/**
 * 自动填入工具函数
 * 用于分析视频文件并提取相关信息自动填入表单
 */

import { analyzeVideoFile } from './videoAnalysis'

/**
 * 获取视频文件的MIME类型
 * @param {string} extension - 文件扩展名
 * @returns {string} MIME类型
 */
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

/**
 * 从视频格式映射到常用格式名称，包含10-bit标记和帧率信息
 * @param {string} format - 视频格式
 * @param {string} formatProfile - 格式配置文件
 * @param {string|number} frameRate - 帧率
 * @returns {string} 格式化后的视频格式名称
 */
const mapVideoFormat = (format, formatProfile, frameRate) => {
  if (!format) return ''

  const formatLower = format.toLowerCase()
  let result = ''

  // H.264/AVC 相关
  if (
    formatLower.includes('avc') ||
    formatLower.includes('h264') ||
    formatLower.includes('h.264')
  ) {
    result = 'AVC'
  }
  // H.265/HEVC 相关
  else if (
    formatLower.includes('hevc') ||
    formatLower.includes('h265') ||
    formatLower.includes('h.265')
  ) {
    result = 'HEVC'
  }
  // VP9
  else if (formatLower.includes('vp9')) {
    result = 'VP9'
  }
  // VP8
  else if (formatLower.includes('vp8')) {
    result = 'VP8'
  }
  // AV1
  else if (formatLower.includes('av01') || formatLower.includes('av1')) {
    result = 'AV1'
  }
  // MPEG-2
  else if (formatLower.includes('mpeg2') || formatLower.includes('mpeg-2')) {
    result = 'MPEG-2'
  }
  // 其他情况返回原始格式名称的大写形式
  else {
    result = format.toUpperCase()
  }

  // 添加10-bit标记
  if (formatProfile && (formatProfile.includes('Main 10') || formatProfile.includes('High 10'))) {
    result += ' 10-bit'
  }

  // 添加帧率信息
  if (frameRate && frameRate !== '未知') {
    const frameRateNum = parseFloat(frameRate)
    if (!isNaN(frameRateNum)) {
      // 四舍五入到小数点后两位
      const roundedFrameRate = Math.round(frameRateNum * 100) / 100
      result += ` @${roundedFrameRate}`
    }
  }

  return result
}

/**
 * 从音频格式映射到常用格式名称，支持多音频轨道标记
 * @param {Array} audioTracks - 音频轨道数组
 * @returns {string} 格式化后的音频格式名称
 */
const mapAudioFormat = (audioTracks) => {
  if (!audioTracks || audioTracks.length === 0) return ''

  // 统计各种音频格式的数量
  const formatCounts = {}

  audioTracks.forEach((track) => {
    if (!track.format || track.format === '未知') return

    const formatLower = track.format.toLowerCase()
    let mappedFormat = ''

    // AAC 相关
    if (formatLower.includes('aac')) {
      mappedFormat = 'AAC'
    }
    // AC-3/Dolby Digital
    else if (
      formatLower.includes('ac-3') ||
      formatLower.includes('ac3') ||
      formatLower.includes('dolby')
    ) {
      mappedFormat = 'AC-3'
    }
    // E-AC-3/Dolby Digital Plus
    else if (
      formatLower.includes('e-ac-3') ||
      formatLower.includes('eac3') ||
      formatLower.includes('ec-3')
    ) {
      mappedFormat = 'E-AC-3'
    }
    // DTS
    else if (formatLower.includes('dts')) {
      mappedFormat = 'DTS'
    }
    // MP3
    else if (formatLower.includes('mp3') || formatLower.includes('mpeg audio')) {
      mappedFormat = 'MP3'
    }
    // FLAC
    else if (formatLower.includes('flac')) {
      mappedFormat = 'FLAC'
    }
    // Opus
    else if (formatLower.includes('opus')) {
      mappedFormat = 'Opus'
    }
    // Vorbis
    else if (formatLower.includes('vorbis')) {
      mappedFormat = 'Vorbis'
    }
    // PCM
    else if (formatLower.includes('pcm')) {
      mappedFormat = 'PCM'
    }
    // 其他情况返回原始格式名称的大写形式
    else {
      mappedFormat = track.format.toUpperCase()
    }

    // 统计格式数量
    formatCounts[mappedFormat] = (formatCounts[mappedFormat] || 0) + 1
  })

  // 生成格式字符串，如果有多个相同格式则添加数量标记
  const formatStrings = Object.entries(formatCounts).map(([format, count]) => {
    return count > 1 ? `${format}x${count}` : format
  })

  return formatStrings.join('+')
}

/**
 * 从分辨率映射到标准分辨率名称
 * @param {string} resolution - 分辨率字符串 (如 "1920x1080")
 * @returns {string} 标准分辨率名称
 */
const mapResolution = (resolution) => {
  if (!resolution) return ''

  const resolutionMap = {
    '3840x2160': '2160p',
    '2560x1440': '1440p',
    '1920x1080': '1080p',
    '1280x720': '720p',
    '854x480': '480p',
    '640x360': '360p'
  }
  return resolutionMap[resolution] || resolution
}

/**
 * 分析视频文件并提取自动填入信息
 * @param {Object} file - 文件对象
 * @returns {Promise<Object>} 提取的信息对象
 */
export const analyzeVideoForAutoFill = async (file) => {
  try {
    // 从文件路径读取文件内容
    const fileBuffer = await window.api.readFile(file.raw.path)

    // 获取文件扩展名
    const extension = file.name.split('.').pop()

    // 创建File对象
    const blob = new Blob([fileBuffer], { type: getVideoMimeType(extension) })
    const fileObj = new File([blob], file.name, {
      type: getVideoMimeType(extension),
      lastModified: file.raw.lastModified ? new Date(file.raw.lastModified).getTime() : Date.now()
    })

    // 使用现有的视频分析函数
    const analysisResult = await analyzeVideoFile(fileObj)

    // 提取需要的信息
    const autoFillData = {
      resolution: mapResolution(analysisResult.video.resolution),
      videoFormat: mapVideoFormat(
        analysisResult.video.format,
        analysisResult.video.formatProfile,
        analysisResult.video.frameRate
      ),
      audioFormat: mapAudioFormat(analysisResult.audio)
    }

    return {
      success: true,
      data: autoFillData,
      rawAnalysis: analysisResult
    }
  } catch (error) {
    console.error('视频分析失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 批量分析多个视频文件（目前只分析第一个文件）
 * @param {Array} files - 文件数组
 * @returns {Promise<Object>} 分析结果
 */
export const analyzeVideosForAutoFill = async (files) => {
  if (!files || files.length === 0) {
    return {
      success: false,
      error: '没有可分析的文件'
    }
  }

  // 目前只分析第一个文件
  const firstFile = files[0]

  try {
    const result = await analyzeVideoForAutoFill(firstFile)
    return result
  } catch (error) {
    return {
      success: false,
      error: `分析文件 ${firstFile.name} 失败: ${error.message}`
    }
  }
}
