<template>
    <a-form :label-col="labelCol" :wrapper-col="wrapperCol">
        <a-form-item label="Activity name">
            <a-input v-model:value="props.initState.name" />
        </a-form-item>
        <a-form-item label="Instant delivery">
            <a-switch v-bind:checked="props.initState.delivery" />
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
                <a-radio value="2">Venue</a-radio>
            </a-radio-group>
        </a-form-item>
        <a-form-item label="Activity form">
            <a-input v-model:value="formState.desc" type="textarea" />
        </a-form-item>
    </a-form>
</template>
    
<script setup lang='ts'>
import { cloneDeep } from 'lodash-es';
import { reactive, watch } from 'vue';
interface FormState {
    name: string;
    delivery: boolean;
    type: string[];
    resource: string;
    desc: string;
}


const props = defineProps<{ initState: FormState }>()


const formState = reactive(props.initState)

// watch(formState, (value) => {
//    props.onChange(value)
// }, { deep: true })
const labelCol = { style: { width: '150px' } }
const wrapperCol = { span: 14 }
</script>
    
<style></style>