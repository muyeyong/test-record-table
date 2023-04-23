<script setup lang="ts">
/** demo
 * 表单： 新增 修改 删除
 * 范围选择： 修改
 * 下拉选择： 修改
 *  选中： 修改
 * 
 * describe集合操作，相同的describe日志进行组合
 */
import { ref } from 'vue';
import { useRouter, type RouteRecordRaw } from 'vue-router';
const router = useRouter()
const selectedKeys = ref([])
const routes: RouteRecordRaw[] = router.options.routes.filter((route) =>
  (route.name as string)?.includes('Demo')
)
const collapsed = ref(false)
const switchRouter = ({ key }: { key: string }) => {
  router.push(key)
}
</script>

<template>
    <a-layout style="width: 100%; height: 100%;">
    <a-layout-sider theme="light"> <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        :inline-collapsed="collapsed"
        @click="switchRouter"
      >
        <a-menu-item v-for="route in routes" :key="route.path">
          <span>{{ route.name }}</span>
        </a-menu-item>
      </a-menu></a-layout-sider>
    <a-layout>
      <a-layout-content style="padding: 2rem;">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
<style scoped>

</style>
