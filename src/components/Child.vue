<template>
    <div>
        <div style="display: flex;">
            <span>姓名(child):</span>
            <a-input style="width: 100px;" v-model:value="value"></a-input>
            <GrandSon />
        </div>
       
    </div>
</template>

<script lang="ts">
import GrandSon from './GrandSon.vue';
export default {
    describe: '孩子输入框'
}
</script>

<script setup lang='ts'>
import { useOperatorLog } from '@/custom-reactive';
const { value, log } = useOperatorLog('', { describe: 'Child姓名'})
const consoleLog = () => {
    console.log(log())
}
</script>

<style>

</style>