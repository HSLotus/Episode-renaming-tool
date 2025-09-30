/**
 * 路由模块汇总
 */
import homeRoutes from './home'
import videoAnalysisRoutes from './video-analysis'
import videoRenameRoutes from './video-rename'

// 导出所有路由配置
export default [
  ...homeRoutes,
  ...videoAnalysisRoutes,
  ...videoRenameRoutes,
  // 404 页面路由（放在最后）
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../../views/not-found.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]
