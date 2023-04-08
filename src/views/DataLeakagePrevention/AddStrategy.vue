<template>
    新增策略
    <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane key="1" tab="基本信息">
            <BaseInfo />
        </a-tab-pane>
        <a-tab-pane key="2" tab="FTP配置">
            <FTPSettings />
        </a-tab-pane>
        <a-tab-pane key="3" tab="应用范围">
            <Applications />
        </a-tab-pane>
       
    </a-tabs>
    <div style="margin: 20px 0; position: absolute; bottom: 0; left: 50%; transform: translate(-50%);">
        <a-button @click="router.go(-1)">取消</a-button>
        <a-button @click="consoleLog">确定</a-button>
    </div>
</template>
    
<script setup lang='ts'>
import { useReactiveRecord } from '@/custom-reactive';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseInfo from './BaseInfo.vue';
import Applications from './Applications.vue';
import FTPSettings from './FTPSettings.vue';

const { log } = useReactiveRecord({}, { describe: '新增策略' })

const router = useRouter()

const activeKey = ref('1')

const consoleLog = () => {
    console.log(log())
}

</script>
    
<style></style>