/**
 * 首页路由配置
 */
export default [
  {
    path: '/',
    name: 'Home',
    component: () => import('../../views/home.vue'),
    meta: {
      title: '首页',
      keepAlive: true
    }
  }
]
