<template>
        <div>
            <span>策略名称:</span>
            <a-input style="width: 300px" v-model:value="baseInfo.name"></a-input>
        </div>
        <div>
            <span>策略描述:</span>
            <a-textarea style="width: 300px" v-model:value="baseInfo.describe" show-count :maxlength="100" />
        </div>
        <div>
            <span>下发优先级:</span>
            <a-select  style="width: 80px" v-model:value="baseInfo.priorityDelivery" :options="options">
            </a-select>
        </div>
        <div>
            <span>执行优先级:</span>
            <a-select  style="width: 80px" v-model:value="baseInfo.executionPriority" :options="options">
            </a-select>
        </div>
        <div>
            <span>状态:</span>
                <a-select  style="width: 80px" v-model:value="baseInfo.status" :options="options2">
                </a-select>
        </div>
</template>
    
<script setup lang='ts'>
import { useReactiveRecord } from '@/custom-reactive';
import { ref } from 'vue';

    const options = ref([...Array(55)].map((_, i) => ({ value: (i + 40), label: (i + 40)  })))
    const options2 = ref([{ value: true, label: "启用"}, { value: false, label: "禁用"}])

    const { value: baseInfo } = useReactiveRecord({
        name: "",
        describe: "",
        priorityDelivery: 70,
        executionPriority: 70,
        status: false
    }, { 
        describe: '基本信息', 
        keyMap: {
                name: '策略名称',
                describe: '策略描述',
                priorityDelivery: '下发优先级',
                executionPriority: '执行优先级',
                status: '状,,l态'
            },
        valueMap: {
            status: {
                true: "启用",
                false: "禁用"
            }
        }

    })
</script>
    
<style>
    
</style>