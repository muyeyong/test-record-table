<template>
    <div>
        <div style="display: flex;">
            <span>姓名(child):</span>
            <a-input style="width: 100px;" v-model:value="value"></a-input>
        </div>
       
    </div>
</template>

<script setup lang='ts'>
import { useReactiveRecord } from '@/custom-reactive';
const { value, log } = useReactiveRecord('', { describe: 'Child姓名'})
const consoleLog = () => {
    console.log(log())
}
</script>

<style>

</style>