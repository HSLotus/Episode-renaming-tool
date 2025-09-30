/**
 * 视频重命名页面路由配置
 */
export default [
  {
    path: '/video-rename',
    name: 'VideoRename',
    component: () => import('../../views/video-rename.vue'),
    meta: {
      title: '视频文件重命名',
      keepAlive: false
    }
  }
]
