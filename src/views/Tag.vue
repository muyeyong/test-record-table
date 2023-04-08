<template>
    <div>
        <p>终端基本属性(可选/可取消)</p>
        <div style="padding: 0 10px;">
            <div v-for="item in basicTag" :key="item.key" style="display: flex;">
                <div style="margin-right: 20px;"> {{ item.key }}</div>
                <span v-for="tag in item.value">
                    <a-checkable-tag v-model:checked="tag.checked" @change="handleTagChange">{{ tag.name
                    }}</a-checkable-tag>
                </span>
            </div>
            <a-button @click="openDialog">新增标签</a-button>
        </div>
        <p style="margin: 20px 0;"> 终端物理环境属性值(可新增/删除)</p>
        <div style="padding: 0 10px;">
            <div v-for="item in physicsTag" :key="item.key" style="display: flex;">
                <div style="margin-right: 20px;"> {{ item.key }}</div>
                <span v-for="tag in item.value" style="cursor: pointer;">
                    <a-tag v-model:checked="tag.checked" @click="handleTagClose(tag)">{{ tag.name }}</a-tag>
                </span>
            </div>
        </div>
    </div>

    <div style="margin: 20px;">
        <div style="margin: 20px 0;">
            日志内容
            <p v-html="logDetail"></p>
        </div>
        <a-button @click="consoleLog">打印日志</a-button>
    </div>

    <a-modal v-model:visible="visible" title="新增标签" @ok="handleOk">
        <div>
            <span>标签类别： </span>
            <a-select ref="select" v-model:value="value1" style="width: 120px">
                <a-select-option value="belong">设备归属</a-select-option>
                <a-select-option value="system">操作系统类型</a-select-option>
            </a-select>
        </div>
        <div>
            <span>标签名称</span>
            <a-input v-model:value="value2"></a-input>
        </div>

    </a-modal>
</template>
    
<script setup lang='ts'>
import { useReactiveRecord } from '@/custom-reactive';
import { ref } from 'vue';

const { value: basicTag, log } = useReactiveRecord(
    [
        {
            key: '设备归属', value: [
                { key: '个人设备', name: '个人设备', checked: false },
                { key: '派发设备', name: '派发设备', checked: false }
            ]
        },
        {
            key: '操作系统类型', value: [
                { key: 'Android', name: 'Android', checked: false },
                { key: 'IOS', name: 'IOS', checked: false },
                { key: 'Linux', name: 'Linux', checked: false }]
        }
    ],
    {
        describe: '终端基本属性', signKey: 'key',
        keyMap: {
            "*": {
                value: {
                    "*": {
                        key: "名称",
                        name: "名称",
                        checked: "状态"
                    }
                }
            }
        },
        valueMap: {
            "*": {
                value: {
                    "*": {
                        checked: {
                            true: "选中",
                            false: "不选中"
                        }

                    }
                }
            }

        }
    })

const { value: physicsTag } = useReactiveRecord([
    {
        key: '网络环境',
        value: [
            { key: '企业网', name: '企业网', checked: true },
            { key: '非企业网', name: '非企业网', checked: false }
        ]
    },
    {
        key: '地理位置',
        value: [
            { key: '境内', name: '境内', checked: false },
            { key: '境外', name: '境外', checked: false }
        ]
    }
], {
    describe: '终端物理环境属性', signKey: 'key',
    keyMap: {
        "*": {
            value: {
                "*": {
                    key: "名称",
                    name: "名称",
                    checked: "状态"
                }
            }
        }
    },
    valueMap: {
        "*": {
            value: {
                "*": {
                    checked: {
                        true: "选中",
                        false: "不选中"
                    }

                }
            }
        }

    }
})

const logDetail = ref("")

const visible = ref(false)

const value1 = ref("belong")
const value2 = ref("")

const handleTagChange = () => {

}

const handleOk = () => {
    console.log(value1.value, value2.value)
    if (value1.value && value2.value) {
        const newTag = { key: value2.value, name: value2.value, checked: false }
        switch (value1.value) {
            case 'belong':
                basicTag.value[0].value.push(newTag)
                break
            case 'system':
                basicTag.value[1].value.push(newTag)
                break
        }
    }
    visible.value = false
}

const openDialog = () => {
    visible.value = true
}

const handleTagClose = (closeTag: any) => {
    physicsTag.value = physicsTag.value.map(item => {
        item.value = item.value.filter(tag => tag.key !== closeTag.key)
        return { ...item }
    })
}

const consoleLog = () => {
    logDetail.value = log()
}

</script>

<script lang='ts'>
export default {
    describe: '终端所处环境定义',
    inheritAttrs: false,
}
</script>
    
<style scoped>
.ant-tag-checkable {
    border: 1px solid #ccc;
}
</style>