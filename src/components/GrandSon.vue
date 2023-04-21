<template>
    <div>
        <div style="display: flex;">
            <span>姓名(grandson):</span>
            <a-input style="width: 100px;" v-model:value="value"></a-input>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    describe: '孙子输入框'
}
</script>

<script setup lang='ts'>
import { useOperatorLog } from '@/custom-reactive';
const { value, log } = useOperatorLog('', { describe: '孙子组件姓名'})
</script>

<style>

</style>