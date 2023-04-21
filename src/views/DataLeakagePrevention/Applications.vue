<template>
    <a-button @click="visible = true
    ">添加范围</a-button>
    <a-table :row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }" :columns="columns"
        :data-source="data" />
    <a-modal v-model:visible="visible" title="添加范围" @ok="handleOk">
        <a-form>
            <a-form-item label="管理域" name="manageDomains">
                <a-select v-model:value="newApplications.manageDomains">
                    <a-select-option value="本管理域">本管理域</a-select-option>
                    <a-select-option value="所有子管理域">所有子管理域</a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="管理对象" name="manageObject">
                <a-select v-model:value="newApplications.manageObject">
                    <a-select-option value="设备">设备</a-select-option>
                    <a-select-option value="用户">用户</a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="对象类型" name="type">
                <a-select v-model:value="newApplications.type">
                    <a-select-option value="所有设备">所有设备</a-select-option>
                    <a-select-option value="设备名称">设备名称</a-select-option>
                    <a-select-option value="设备IP">设备IP</a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="设备名称" name="machineName" v-show="newApplications.type === '设备名称'">
                <a-input v-model:value="newApplications.machineName"></a-input>
            </a-form-item>
            <a-form-item label="IP地址范围" name="machineName" v-show="newApplications.type === '设备IP'">
                <div style="display: flex;">
                    <a-input v-model:value="newApplications.ipStart"></a-input> ~ <a-input
                        v-model:value="newApplications.ipEnd"></a-input>
                </div>
            </a-form-item>
            <a-form-item label="操作系统位数" name="architecture">
                <a-select v-model:value="newApplications.architecture">
                    <a-select-option value="所有操作系统">所有操作系统</a-select-option>
                    <a-select-option value="32位操作系统">32位操作系统</a-select-option>
                    <a-select-option value="64位操作系统">64位操作系统</a-select-option>
                </a-select>

            </a-form-item>
            <a-form-item label="操作系统名称" name="system">
                <a-select v-model:value="newApplications.system">
                    <a-select-option value="Microsoft Windows 10 专业版 32-bit">Microsoft Windows 10 专业版
                        32-bit</a-select-option>
                    <a-select-option value="Microsoft Windows 10 专业版(x64 Edition)">Microsoft Windows 10 专业版(x64
                        Edition)</a-select-option>
                    <a-select-option value="Microsoft Windows 11 家庭中文版(x64 Edition)">Microsoft Windows 11 家庭中文版(x64
                        Edition)</a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="操作系统语言" name="language">
                <a-select v-model:value="newApplications.language">
                    <a-select-option value="所有语言">所有语言</a-select-option>
                    <a-select-option value="Chinese (Taiwan)">Chinese (Taiwan)</a-select-option>
                    <a-select-option value="English (United States)">English (United States)</a-select-option>
                </a-select>

            </a-form-item>
            <a-form-item label="描述" name="describe">
                <a-input v-model:value="newApplications.describe"></a-input>
            </a-form-item>
        </a-form>

    </a-modal>
</template>
    
<script setup lang='ts'>
import { useOperatorLog } from '@/custom-reactive';
import { reactive, ref, computed } from 'vue';
type Key = string | number;

interface DataType {
    key: Key;
    manageDomains: string;
    manageObject: string;
    type: string;
    value: string
    architecture: string
    system: string
    language: string
    exceptionEffectTime?: string
    describe: string
    machineName?: string
    ipStart?: string
    ipEnd?: string
}

const state = reactive<{
    selectedRowKeys: Key[];
    loading: boolean;
}>({
    selectedRowKeys: [], // Check here to configure the default column
    loading: false,
});
const columns = [
    {
        title: '管理域',
        dataIndex: 'manageDomains',
    },
    {
        title: '管理对象',
        dataIndex: 'manageObject',
    },
    {
        title: '类型',
        dataIndex: 'type',
    },
    {
        title: '值',
        dataIndex: 'value'
    },
    {
        title: '操作系统位数',
        dataIndex: 'architecture'
    },
    {
        title: '操作系统',
        dataIndex: 'system'
    },
    {
        title: '语言',
        dataIndex: 'language'
    },
    {
        title: '例外生效时间',
        dataIndex: 'exceptionEffectTime'
    },
    {
        title: '描述',
        dataIndex: 'describe'
    }
];
const { value: data } = useOperatorLog<DataType[]>([], {
    describe: '应用范围',
    signKey: ['manageDomains'],
    keyMap: {
        key: "*",
        manageDomains: "管理域",
        manageObject: "管理对象",
        type: "管理类型",
        architecture: "操作系统位数",
        system: "操作系统名称",
        language: "语言",
        describe: "描述",
        value: "值",
        machineName: "设备名称",
        ipStart: "起始ip",
        ipEnd: "终止ip"
    }
});
const emptyApplication = {
    manageDomains: '',
    manageObject: "",
    type: "",
    value: "",
    architecture: "",
    system: "",
    language: '',
    describe: "",
    machineName: "",
    ipStart: "",
    ipEnd: ""
}
//TODO 自定义一个前置过滤器，去除掉一些不需要处理的值
const { value: newApplications } = useOperatorLog({
    manageDomains: '',
    manageObject: "",
    type: "",
    architecture: "",
    system: "",
    language: '',
    describe: "",
    machineName: "",
    ipStart: "",
    ipEnd: ""
}, { individual: true })
const visible = ref(false)

const dataValue = computed(() => {
    return newApplications.value.type === '所有设备' ? "" : newApplications.value.type === "设备名称" ? newApplications.value.machineName : `${newApplications.value.ipStart} ~ ${newApplications.value.ipEnd}`
})
const handleOk = () => {
    visible.value = false
    data.value.push({ key: data.value.length, value: dataValue.value, ...newApplications.value })
    newApplications.value = emptyApplication
}

const onSelectChange = (selectedRowKeys: Key[]) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    state.selectedRowKeys = selectedRowKeys;
};

</script>
    
<script lang='ts'>
export default {
  describe: '新增应用范围',
  inheritAttrs: false,
}
</script>
<style></style>