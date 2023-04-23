<template>
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
  <p v-html="logDetail"></p>
  <a-button @click="addColumn">新增一行</a-button>
  <a-button @click="deleteColumn">删除一行</a-button>
  <a-button @click="statusChange(true)">状态激活</a-button>
  <a-button @click="statusChange(false)">状态禁用</a-button>
  <a-button @click="consoleLog">打印日志</a-button>
</template>
<script lang="ts" setup>
import { nextTick, reactive, ref, type UnwrapRef } from 'vue'
import { useOperatorLog } from '@/custom-reactive'
import { cloneDeep } from 'lodash-es'
import type { TableProps } from 'ant-design-vue';
//TODO 分页后数据的处理
// 新增
// 删除
// 修改
interface DataItem {
  key: string;
  name: string;
  age: number;
  status: boolean
  address: string;
}

const { value: dataSource, log, setValue } = useOperatorLog([
  {
    key: '1',
    name: '胡彦斌',
    age: 32,
    status: true,
    address: '西湖区湖底公园1号',
  },
  {
    key: '2',
    name: '吴彦祖',
    age: 42,
    status: true,
    address: '西湖区湖底公园2号',
  },
], {
  describe: '用户信息表', signKey: ['name'], 
  keyMap: {
    key: "*",
    name: '姓名',
    address: "地址",
    age: "年龄",
    status: "状态"
  },
  valueMap: {
      status: {
        true: "启用",
        false: "禁用"
      }
  }
})
const columns = reactive([
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: '住址',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: 'operation',
    dataIndex: 'operation',
  },
])
let tableSelectedRowKeys: string[] = []
const logDetail = ref('')
const editableData: UnwrapRef<Record<string, DataItem>> = reactive({});
const addColumn = () => {
  dataSource.value.push(
    { key: '3', name: '王大爷', age: 39, status: true, address: '麻花大街芝麻巷' }
  )
}

const edit = (key: string) => {
  editableData[key] = cloneDeep(dataSource.value.filter(item => key === item.key)[0]);
};
const save = (key: string) => {
  Object.assign(dataSource.value.filter(item => key === item.key)[0], editableData[key]);
  // setValue(dataSource.value)
  delete editableData[key];
};
const cancel = (key: string) => {
  delete editableData[key];
};

const deleteColumn = () => {
  dataSource.value.pop()
  // setValue(dataSource.value)
}
const consoleLog = () => {
  logDetail.value = log()
}
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
  // setValue(dataSource.value)
}
</script>

<script lang='ts'>
export default {
  name: 'UserTable',
  describe: '用户信息表单',
  inheritAttrs: false,
  customOptions: {}
}
</script>