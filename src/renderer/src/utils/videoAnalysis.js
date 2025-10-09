/**
 * 视频分析工具函数
 * 使用 MediaInfo.js 分析视频文件信息
 */

/**
 * 分析单个视频文件
 * @param {File} file - 视频文件对象
 * @returns {Promise<Object>} 视频分析结果
 */
export const analyzeVideoFile = (file) => {
  return new Promise((resolve, reject) => {
    // 检查是否为视频文件
    if (!file.type.startsWith('video/')) {
      reject(new Error('不是有效的视频文件'))
      return
    }

    // 获取文件大小的函数
    const getSize = () => file.size

    // 读取文件块的函数
    const readChunk = (chunkSize, offset) =>
      new Promise((chunkResolve, chunkReject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target.error) {
            chunkReject(event.target.error)
          } else {
            chunkResolve(new Uint8Array(event.target.result))
          }
        }
        reader.onerror = () => chunkReject(reader.error)
        reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
      })

    // 使用 MediaInfo 分析文件
    if (window.MediaInfo) {
      window
        .MediaInfo()
        .then((mediaInfo) => {
          mediaInfo
            .analyzeData(getSize, readChunk)
            .then((result) => {
              // 提取视频信息
              const videoInfo = extractVideoInfo(result, file)
              resolve(videoInfo)
            })
            .catch((error) => {
              reject(new Error(`视频分析失败: ${error.message}`))
            })
        })
        .catch((error) => {
          reject(new Error(`MediaInfo 初始化失败: ${error.message}`))
        })
    } else {
      reject(new Error('MediaInfo 库未加载'))
    }
  })
}

/**
 * 从 MediaInfo 结果中提取视频信息
 * @param {Object} mediaInfoResult - MediaInfo 分析结果
 * @param {File} file - 原始文件对象
 * @returns {Object} 格式化的视频信息
 */
const extractVideoInfo = (mediaInfoResult, file) => {
  const tracks = mediaInfoResult.media?.track || []
  const generalTrack = tracks.find((track) => track['@type'] === 'General') || {}
  const videoTrack = tracks.find((track) => track['@type'] === 'Video') || {}
  const audioTracks = tracks.filter((track) => track['@type'] === 'Audio') || []

  return {
    // 基本信息
    fileName: file.name,
    fileSize: file.size,
    fileSizeFormatted: formatFileSize(file.size),

    // 通用信息
    format: generalTrack.Format || '未知',
    duration: generalTrack.Duration || videoTrack.Duration || '未知',
    durationFormatted: formatDuration(generalTrack.Duration || videoTrack.Duration),
    bitRate: generalTrack.OverallBitRate || '未知',
    bitRateFormatted: formatBitRate(generalTrack.OverallBitRate),

    // 视频信息
    video: {
      format: videoTrack.Format || '未知',
      formatProfile: videoTrack.Format_Profile || '未知',
      codec: videoTrack.CodecID || videoTrack.Format || '未知',
      width: videoTrack.Width || '未知',
      height: videoTrack.Height || '未知',
      resolution:
        videoTrack.Width && videoTrack.Height ? `${videoTrack.Width}x${videoTrack.Height}` : '未知',
      frameRate: videoTrack.FrameRate || '未知',
      frameRateFormatted: formatFrameRate(videoTrack.FrameRate),
      bitRate: videoTrack.BitRate || '未知',
      bitRateFormatted: formatBitRate(videoTrack.BitRate),
      aspectRatio: videoTrack.DisplayAspectRatio || '未知'
    },

    // 音频信息
    audio: audioTracks.map((audioTrack) => ({
      format: audioTrack.Format || '未知',
      codec: audioTrack.CodecID || audioTrack.Format || '未知',
      channels: audioTrack.Channels || '未知',
      channelsFormatted: formatChannels(audioTrack.Channels),
      sampleRate: audioTrack.SamplingRate || '未知',
      sampleRateFormatted: formatSampleRate(audioTrack.SamplingRate),
      bitRate: audioTrack.BitRate || '未知',
      bitRateFormatted: formatBitRate(audioTrack.BitRate),
      language: audioTrack.Language || '未知'
    })),

    // 原始数据（用于调试）
    rawData: mediaInfoResult
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时长
 * @param {string|number} duration - 时长（毫秒）
 * @returns {string} 格式化后的时长
 */
const formatDuration = (duration) => {
  if (!duration) return '未知'
  const seconds = Math.floor(duration / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

/**
 * 格式化比特率
 * @param {string|number} bitRate - 比特率
 * @returns {string} 格式化后的比特率
 */
const formatBitRate = (bitRate) => {
  if (!bitRate) return '未知'
  const rate = parseInt(bitRate)
  if (rate >= 1000000) {
    return `${(rate / 1000000).toFixed(1)} Mbps`
  } else if (rate >= 1000) {
    return `${(rate / 1000).toFixed(0)} Kbps`
  } else {
    return `${rate} bps`
  }
}

/**
 * 格式化帧率
 * @param {string|number} frameRate - 帧率
 * @returns {string} 格式化后的帧率
 */
const formatFrameRate = (frameRate) => {
  if (!frameRate) return '未知'
  const rate = parseFloat(frameRate)
  return `${rate.toFixed(2)} fps`
}

/**
 * 格式化声道数
 * @param {string|number} channels - 声道数
 * @returns {string} 格式化后的声道数
 */
const formatChannels = (channels) => {
  if (!channels) return '未知'
  const channelMap = {
    1: '单声道',
    2: '立体声',
    6: '5.1环绕声',
    8: '7.1环绕声'
  }
  return channelMap[channels.toString()] || `${channels}声道`
}

/**
 * 格式化采样率
 * @param {string|number} sampleRate - 采样率
 * @returns {string} 格式化后的采样率
 */
const formatSampleRate = (sampleRate) => {
  if (!sampleRate) return '未知'
  const rate = parseInt(sampleRate)
  return `${(rate / 1000).toFixed(1)} kHz`
}
