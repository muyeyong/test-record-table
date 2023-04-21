<template>
    <a-button @click="addItem">新增</a-button>
    <a-button @click="up">上移</a-button>
    <a-button @click="down">下移</a-button>
    <a-button @click="consoleLog">打印日志</a-button>
    <div class="item" v-for="(item, index) in value" :key="item.__signKey">
        <header>
            <a-checkbox @change="(e: CheckboxChangeEvent) => handleSelect(e, index)"></a-checkbox>
            <span style="margin-left: 10px;">序号 {{ index + 1 }}</span>
        </header>
        <div class="body">
            <a-form :label-col="labelCol" :wrapper-col="wrapperCol">
        <a-form-item label="Activity name">
            <a-input v-model:value="item.name" />
        </a-form-item>
        <a-form-item label="Instant delivery">
            <a-switch v-model:checked="item.delivery" />
        </a-form-item>
        <a-form-item label="Activity type">
            <a-checkbox-group v-model:value="item.type">
                <a-checkbox value="1" name="type">Online</a-checkbox>
                <a-checkbox value="2" name="type">Promotion</a-checkbox>
                <a-checkbox value="3" name="type">Offline</a-checkbox>
            </a-checkbox-group>
        </a-form-item>
        <a-form-item label="Resources">
            <a-radio-group v-model:value="item.resource">
                <a-radio value="1">Sponsor</a-radio>
                <a-radio value="2">Venue</a-radio>
            </a-radio-group>
        </a-form-item>
        <a-form-item label="Activity form">
            <a-input v-model:value="item.desc" type="textarea" />
        </a-form-item>
    </a-form>
        </div>
    </div>
    <p v-html="logDetail"></p>
</template>
    
<script setup lang='ts'>
import { useOperatorLog } from '@/custom-reactive';
import type { CheckboxChangeEvent } from 'ant-design-vue/lib/_util/EventInterface';
import { ref } from 'vue';
import keyMap from './formKeyMap.json'
import valueMap from './formValueMap.json'
import Form from './Form.vue';
const selectedRow = ref<number[]>([])
const { value, log } = useOperatorLog([
    {
        name: '',
        delivery: false,
        type: [],
        resource: '',
        desc: '',
    }
], { keyMap, valueMap, signKey: ['name'] })

const labelCol = { style: { width: '150px' } }
const wrapperCol = { span: 14 }
const addItem = () => {
    value.value.push({
        name: '',
        delivery: false,
        type: [],
        resource: '',
        desc: ''
    })
}

const logDetail = ref("")
const consoleLog = () => {
    logDetail.value = log()
}

const handleChange = (index: number, data: any) => {
    console.log(index, data)
    value.value[index] = data
}
const handleSelect = (e: CheckboxChangeEvent, index: number) => {
    if (e.target.checked) {
        selectedRow.value.push(index)
    } else {
        selectedRow.value = selectedRow.value.filter(item => item !== index)
    }
}

const swap = (arr: Array<any>, index1: number, index2: number) => {
    const temp = arr[index1]
    arr[index1] = arr[index2]
    arr[index2] = temp
}
const up = () => {
    /**
     *TODO 移动多个位置
     */
    const sortedRow = selectedRow.value.sort()
    if (sortedRow[0] === 0) return
    for(const index of sortedRow) {
       swap(value.value, index - 1, index)
    }
    console.log(value.value)
}
const down = () => {
    const index =  selectedRow.value[0]
}

</script>
    
<style scoped>
.item {
    border: 1px solid #ccc;
    margin-bottom: 10px;
}

.item header {
    display: flex;
    align-items: center;
    height: 40px;
    border-bottom: 1px solid #ccc;
    padding-left: 20px;
}

.item .body {
    padding: 20px 0px;
}
</style>