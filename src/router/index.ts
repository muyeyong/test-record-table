import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/InputDemo',
      name: '输入框 Demo',
      component: () => import('../views/Input.vue')
    },
    {
      path: '/TableDemo',
      name: '表格 Demo',
      component: () => import('../views/Table.vue')
    },
    {
      path: '/TagDemo',
      name: '标签 Demo',
      component: () => import('../views/Tag.vue')
    },
    {
      path: '/SelectDemo',
      name: '下拉选择 Demo',
      component: () => import('../views/Select.vue')
    },
    {
      path: '/FormDemo',
      name: '表单 Demo',
      component: () => import('../views/Form.vue')
    },
    {
      path: '/DataLeakagePrevention',
      name: '数据防泄漏 Demo',
      component: () => import('../views/DataLeakagePrevention/Index.vue')
    },
    {
      path: '/AddStrategy',
      name: '增加策略',
      component: () => import('../views/DataLeakagePrevention/AddStrategy.vue')
    },
    {
      path: '/MulForm',
      name: '多个表单 Demo',
      component: () => import('../views/MulForm/MulForm.vue')
    }
  ]
})

export default router
