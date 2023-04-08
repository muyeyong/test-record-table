<template>
    <div>业务数据防泄漏策略</div>
    <div class="action"></div>
    <div>
        <a-table :columns="columns" :data-source="dataSource" :row-selection="rowSelection" bordered>
            <template #bodyCell="{ column, text, record }">
                <template v-if="['name', 'age', 'address'].includes(column.dataIndex)">
                    <div>
                        <a-input v-if="editableData[record.key]" v-model:value="editableData[record.key][column.dataIndex]"
                            style="margin: -5px 0" />
                        <template v-else>
                            {{ text }}
                        </template>
                    </div>
                </template>
                <template v-else-if="column.dataIndex === 'status'">
                    {{ text ? '启用' : '禁用' }}
                </template>
                <template v-else-if="column.dataIndex === 'operation'">
                    <div class="editable-row-operations">
                        <span v-if="editableData[record.key]">
                            <a-typography-link @click="save(record.key)">Save</a-typography-link>
                            <a-popconfirm title="Sure to cancel?" @confirm="cancel(record.key)">
                                <a>Cancel</a>
                            </a-popconfirm>
                        </span>
                        <span v-else>
                            <a @click="edit(record.key)">Edit</a>
                        </span>
                    </div>
                </template>
            </template>
        </a-table>
        <a-button @click="addStrategy">新增策略</a-button>
    </div>
</template>
    
<script setup lang='ts'>
import { useReactiveRecord } from '@/custom-reactive';
import { reactive, type UnwrapRef } from 'vue';
import type { TableProps } from 'ant-design-vue';
import { cloneDeep } from 'lodash-es'
import { useRouter } from 'vue-router'

interface DataItem {
    key: string;
    name: string;
    type: string
    describe: string
    priorityDelivery: number
    executionPriority: number
    manageDomains: string
    status: boolean
}
const router = useRouter()
const { value: dataSource, log } = useReactiveRecord([
    {
        key: '1',
        name: '策略1',
        type: 'WEB应用防泄密策略',
        status: true,
        describe: '这是一个WEB应用防泄密策略',
        priorityDelivery: 65,
        executionPriority: 60,
        manageDomains: '本管理域'

    }
], { describe: '业务数据防泄漏策略', signKey: 'name' })
const columns = reactive([
    {
        title: '策略名称',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: '策略类型',
        dataIndex: 'type',
        key: 'type',
    },
    {
        title: '策略描述',
        dataIndex: 'describe',
        key: 'describe',
    },
    {
        title: '下发优先级',
        dataIndex: 'priorityDelivery',
        key: 'priorityDelivery',
    },
    {
        title: '执行优先级',
        dataIndex: 'executionPriority',
        key: 'executionPriority',
    },
    {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
    },
    {
        title: '管理域',
        dataIndex: 'manageDomains',
        key: 'manageDomains',
    },
    {
        title: 'operation',
        dataIndex: 'operation',
    },
])
const editableData: UnwrapRef<Record<string, DataItem>> = reactive({});
let tableSelectedRowKeys: string[] = []

const edit = (key: string) => {
      editableData[key] = cloneDeep(dataSource.value.filter(item => key === item.key)[0]);
    };
    const save = (key: string) => {
      Object.assign(dataSource.value.filter(item => key === item.key)[0], editableData[key]);
      delete editableData[key];
    };
    const cancel = (key: string) => {
      delete editableData[key];
    };

const rowSelection: TableProps['rowSelection'] = {
    onChange: (selectedRowKeys: string[], selectedRows: DataItem[]) => {
        tableSelectedRowKeys = selectedRowKeys
    }
}
const statusChange = (status: boolean) => {
    tableSelectedRowKeys.forEach(key => {
        const target = dataSource.value.find(item => item.key.toString() === key.toString())
        if (target) target.status = status
    })
}

const addStrategy = () => {
    router.push('AddStrategy')
}
</script>
    
<style></style>