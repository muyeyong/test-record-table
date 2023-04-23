<template>
        <div>
            <div style="display: flex;">
                <span style="font-weight: 700;">姓名(没有初始值，单个响应式数据描述一个属性):</span>
                <a-input style="width: 100px;" v-model:value="value"></a-input>
            </div>
           <div style="display: flex;">
                <span style="font-weight: 700;">地址(有初始值，单个响应式数据描述一个属性)</span>
                <a-input style="width: 100px;" v-model:value="address"></a-input>
            </div>
            <div>
                <span style="font-weight: 700;">二级(多个响应式数据描述一个属性)</span>
                <div style="display: flex;">
                    <span>姓名</span>
                    <a-input style="width: 100px;" v-model:value="name2"></a-input>
                </div>
                <div style="display: flex;">
                    <span>地址</span>
                    <a-input style="width: 100px;" v-model:value="address2"></a-input>
                </div>
                <!-- <h3 style="margin: 10px 20px;">三级</h3> -->
            </div>
            <hr style="margin: 10px;">
            <div>
                <p style="font-weight: 700;">用户信息(处理对象)</p>
                名字: <a-input style="width: 100px;"  v-model:value="person.name"></a-input>
                地址：<a-input style="width: 100px;"  v-model:value="person.address"></a-input>
            </div>
            <hr style="margin: 10px;">
            <span style="font-weight: 700;">子孙组件处理</span>
            <Child />
            <hr style="margin: 10px;">
            <p v-html="logDetail"></p><br/>
            <a-button style="margin: 10px 0;" @click="consoleLog">获取变化日志</a-button>
        </div>
</template>


<script lang='ts'>
  export default {
    describe: '基本输入',
    inheritAttrs: false
  }
</script>
    
<script setup lang='ts'>
    import inputKeyMap from './inputKeyMap.json'
    import tableKeyMap from './formKeyMap.json'
    import Child from '../components/Child.vue';
    import { useOperatorLog } from '@/custom-reactive';
    import { ref } from 'vue';
    const logDetail = ref('')
    const { value, log } = useOperatorLog('', { describe: '姓名', keyMap: inputKeyMap })
    const { value: address } = useOperatorLog('马栏山', { describe: '地址', keyMap: tableKeyMap})
    const { value: name2 } = useOperatorLog('王大治', { describe: '姓名',  parent: '二级'})
    const { value: address2 } = useOperatorLog('四方坪', { describe: '地址', parent: '二级'})
    const { value: person} = useOperatorLog({ name: '哇哈哈', address: '麓谷大道'}, { describe: '用户信息', keyMap: { name: "姓名", address: "地址"}})
    const consoleLog = () => {
       logDetail.value =  log()
    }
</script>

    
<style>
    
</style>