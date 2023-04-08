<template>
    <div>
        <p>FTP文件传输协议访问控制列表</p>
        <a-button @click="visible = true">增加</a-button>
        <a-table :dataSource="dataSource" :columns="columns" />

    </div>
    <a-modal v-model:visible="visible" :width="800" title="新增FTP访问列表" @ok="handleOk">
        <a-form>
            <a-form-item label="进程" name="process">
                <div style="display: flex;">
                    <a-select v-model:value="formState.process.equal">
                        <a-select-option value="equal">相等</a-select-option>
                        <a-select-option value="noEqual">不相等</a-select-option>
                    </a-select>
                    <a-select v-model:value="formState.process.features">
                        <a-select-option value="processName">进程名称</a-select-option>
                        <a-select-option value="companyName">进程文件属性:公司名称</a-select-option>
                        <a-select-option value="describe">进程文件属性:描述</a-select-option>
                        <a-select-option value="md5">进程文件MD5值</a-select-option>
                    </a-select>
                    <a-input v-model:value="formState.process.featuresValue"></a-input>
                </div>
            </a-form-item>
            <a-form-item label="IP/域名" name="ip">
                <div style="display: flex;">
                    <a-select v-model:value="formState.ip.equal">
                        <a-select-option value="equal">相等</a-select-option>
                        <a-select-option value="noEqual">不相等</a-select-option>
                    </a-select>
                    <a-input v-model:value="formState.ip.value"></a-input>
                </div>
            </a-form-item>
            <a-form-item label="端口范围" name="portRange">
                <div style="display: flex;">
                    <a-select v-model:value="formState.portRange.equal">
                        <a-select-option value="equal">相等</a-select-option>
                        <a-select-option value="noEqual">不相等</a-select-option>
                    </a-select>
                    <a-input v-model:value="formState.portRange.value"></a-input>
                </div>
            </a-form-item>
            <a-form-item label="FTP操作" name="process">
                <a-checkbox-group v-model:value="formState.FTPOptions">
                    <a-checkbox value="1">登录</a-checkbox>
                    <a-checkbox value="2">上传</a-checkbox>
                    <a-checkbox value="3">下载</a-checkbox>
                    <a-checkbox value="4">删除</a-checkbox>
                    <a-checkbox value="5">重命名</a-checkbox>
                    <a-checkbox value="6">其他命令</a-checkbox>
                </a-checkbox-group>
            </a-form-item>
            <a-form-item label="本地文件路径" name="localFilePath">
                <div style="display: flex;">
                    <a-select v-model:value="formState.localFilePath.equal">
                        <a-select-option value="equal">相等</a-select-option>
                        <a-select-option value="noEqual">不相等</a-select-option>
                    </a-select>
                    <a-input v-model:value="formState.localFilePath.value"></a-input>
                </div>
            </a-form-item>
            <a-form-item label="远程文件路径" name="remoteFilePath">
                <div style="display: flex;">
                    <a-select v-model:value="formState.remoteFilePath.equal">
                        <a-select-option value="equal">相等</a-select-option>
                        <a-select-option value="noEqual">不相等</a-select-option>
                    </a-select>
                    <a-input v-model:value="formState.remoteFilePath.value"></a-input>
                </div>
            </a-form-item>
            <a-form-item label="敏感规则模板" name="sensitiveRule">
                <div style="display: flex;">
                    <a-select v-model:value="formState.sensitiveRule.equal">
                        <a-select-option value="equal">相等</a-select-option>
                        <a-select-option value="noEqual">不相等</a-select-option>
                    </a-select>
                    <a-input v-model:value="formState.sensitiveRule.value"></a-input>
                </div>
            </a-form-item>
            <a-form-item label="动作" name="action">
                <a-checkbox-group v-model:value="formState.actions">
                    <a-checkbox value="1">审计</a-checkbox>
                    <a-checkbox value="2">阻止</a-checkbox>
                    <a-checkbox value="3">异步上传</a-checkbox>
                </a-checkbox-group>
            </a-form-item>
            <a-form-item label="提示信息" name="message">
                <a-radio-group v-model:value="formState.promptMessage.radio">
                    <a-radio value="1">不弹出提示信息</a-radio>
                    <a-radio value="2">弹出自定义提示信息</a-radio>
                </a-radio-group>
                <a-textarea
                    v-model:value="formState.promptMessage.content"
                    placeholder="输入提示信息"
                    auto-size
                    />
            </a-form-item>
        </a-form>
    </a-modal>
    <div>
        <p>其他配置</p>
    </div>
</template>
    
<script setup lang='ts'>
import { useReactiveRecord } from '@/custom-reactive';
import { reactive, ref } from 'vue';
import ftpKeyMap from './ftpKeyMap.json'
import ftpValueMap from './ftpValueMap.json'

const formStateEmpty = {
    process: {
        key: "process",
        equal: "noEqual",
        features: "processName",
        featuresValue: ""
    },
    ip: {
        key: "ip",
        equal: "noEqual",
        value: ""
    },
    portRange: {
        key: "portRange",
        equal: "noEqual",
        value: ""
    },
    FTPOptions: [],
    localFilePath: {
        equal: "noEqual",
        value: ""
    },
    remoteFilePath: {
        equal: "noEqual",
        value: ""
    },
    sensitiveRule: {
        equal: "noEqual",
        value: ""
    },
    actions: [],
    promptMessage: {
        radio: "",
        content: ""
    }
}

/**
 * 有些值是绑定关系，例如提示信息
 */
const columns = reactive([
    {
        title: '等于',
        dataIndex: 'equal'
    },
    {
        title: '进程特征项',
        dataIndex: 'processFeatures'
    },
    {
        title: '进程特征值',
        dataIndex: 'processFeaturesValue'
    },
    {
        title: '等于',
        dataIndex: 'equal2'
    },
    {
        title: 'IP/域名',
        dataIndex: 'ip'
    },
    {
        title: '等于',
        dataIndex: 'equal3'
    },
    {
        title: '端口范围',
        dataIndex: 'portRange'
    },
    {
        title: 'FTP操作',
        dataIndex: 'FTPOptions'
    },
    {
        title: '等于',
        dataIndex: 'equal4'
    },
    {
        title: '本地文件路径',
        dataIndex: 'localFilePath'
    },
    {
        title: '等于',
        dataIndex: 'equal5'
    },
    {
        title: '远程文件路径',
        dataIndex: 'remoteFilePath'
    },
    {
        title: '等于',
        dataIndex: 'equal6'
    },
    {
        title: '敏感规则',
        dataIndex: 'sensitiveRule'
    },
    {
        title: "审计",
        dataIndex: "audit"
    },
    {
        title: "阻止",
        dataIndex: "prevent"
    },
    {
        title: "异步上传",
        dataIndex: "syncUpdate"
    },
    {
        title: "弹出消息",
        dataIndex: "notification"
    },
    {
        title: "弹出提示内容",
        dataIndex: "message"
    }
])
const visible = ref(false)
const handleOk = () => {
    console.log(formLog())
}
const { value: dataSource } = useReactiveRecord([], { describe: 'FTP文件传输协议访问控制列表' })

const { value: formState, log: formLog  } = useReactiveRecord(formStateEmpty, { describe: '新增FTP访问控制列表', individual: true,keyMap: ftpKeyMap, valueMap: ftpValueMap })
</script>
    
<style></style>