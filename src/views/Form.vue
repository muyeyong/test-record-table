<template>
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
        <a-form-item label="Activity name">
            <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="Instant delivery">
            <a-switch v-model:checked="formState.delivery" />
        </a-form-item>
        <a-form-item label="Activity type">
            <a-checkbox-group v-model:value="formState.type">
                <a-checkbox value="1" name="type">Online</a-checkbox>
                <a-checkbox value="2" name="type">Promotion</a-checkbox>
                <a-checkbox value="3" name="type">Offline</a-checkbox>
            </a-checkbox-group>
        </a-form-item>
        <a-form-item label="Resources">
            <a-radio-group v-model:value="formState.resource">
                <a-radio value="1">Sponsor</a-radio>
                <a-radio value="2" >Venue
                    <a-input v-model:value="formState.maximumFlow" />
                </a-radio>
            </a-radio-group>
        </a-form-item>
        <a-form-item label="Activity form">
            <a-input v-model:value="formState.desc" type="textarea" />
        </a-form-item>
        <a-form-item :wrapper-col="{ span: 14, offset: 4 }">
            <a-button type="primary" @click="onSubmit">Create</a-button>
            <a-button style="margin-left: 10px">Cancel</a-button>
        </a-form-item>
    </a-form>
    <p v-html="logDetail"></p>
</template>
    
<script setup lang='ts'>
import { ref, toRaw, computed } from 'vue';
import { useOperatorLog } from '@/custom-reactive';
import keyMap from './formKeyMap.json'
import valueMap from './formValueMap.json'
import diyValueMap from './formValueDiyMap'

interface FormState {
    name: string;
    delivery: boolean;
    type: string[];
    resource: string;
    desc: string;
}
const maximumFlow = ref(10086)

const t = computed(() => {
    return `最大流量${maximumFlow.value}KB/S`
})

// TODO 这样太麻烦了，t变动后日志也要更新
const { value: formState, log } = useOperatorLog({
    name: '',
    delivery: false,
    type: [],
    resource: '',
    desc: '',
    maximumFlow: 0
}, { describe: '表单', valueMap: diyValueMap([{'resource.2': t }]), keyMap} );

const logDetail = ref('')
const onSubmit = () => {
    logDetail.value = log()
    console.log('submit!', toRaw(formState));
};
const labelCol = { style: { width: '150px' } }
const wrapperCol = { span: 14 }
</script>
    
<style></style>