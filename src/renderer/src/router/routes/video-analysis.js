/**
 * 视频分析路由配置
 */
export default [
  {
    path: '/video-analysis',
    name: 'VideoAnalysis',
    component: () => import('../../views/video-analysis.vue'),
    meta: {
      title: '视频分析',
      keepAlive: false
    }
  }
]
