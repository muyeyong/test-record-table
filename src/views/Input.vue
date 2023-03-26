<template>
        <div>
            <div style="display: flex;">
                <span>姓名(没有初始值):</span>
                <a-input style="width: 100px;" v-model:value="value"></a-input>
            </div>
           <!-- <div style="display: flex;">
                <span>地址(有初始值)</span>
                <a-input style="width: 100px;" v-model:value="address"></a-input>
            </div>
            <hr style="margin: 10px;">
            <div>
                <h2>二级</h2>
                <div style="display: flex;">
                    <span>姓名</span>
                    <a-input style="width: 100px;" v-model:value="name2"></a-input>
                </div>
                <div style="display: flex;">
                    <span>地址</span>
                    <a-input style="width: 100px;" v-model:value="address2"></a-input>
                </div>
                <h3 style="margin: 10px 20px;">三级</h3>
            </div>
            <hr style="margin: 10px;">
            <div>
                <p>用户信息(处理对象)</p>
                名字: <a-input style="width: 100px;"  v-model:value="person.name"></a-input>
                地址：<a-input style="width: 100px;"  v-model:value="person.address"></a-input>
            </div> -->
            <hr style="margin: 10px;">
            <Child />
            <hr style="margin: 10px;">
            <!-- <isolationChild /> -->
            <hr style="margin: 10px;">
            <a-button @click="() => visible = !visible">隐藏子组件</a-button>
            <a-button style="margin: 10px 0;" @click="consoleLog">获取变化日志</a-button>
        </div>
</template>


<script lang='ts'>
  export default {
    name: 'CustomName',
    describe: '基本输入',
    inheritAttrs: false,
    customOptions: {}
  }
</script>
    
<script setup lang='ts'>
    import Child from '../components/Child.vue';
    import { useReactiveRecord, useIsolationRecord } from '@/custom-reactive';
    import { ref } from 'vue';

    const visible = ref(true)
    // const isolationChild = useIsolationRecord(Child)
    const { value, log } = useReactiveRecord('', { describe: '姓名'})
    // const { value: address } = useReactiveRecord('马栏山', { describe: '地址'})
    // const { value: name2 } = useReactiveRecord('王大治', { describe: '姓名',  parent: '二级'})
    // const { value: address2 } = useReactiveRecord('四方坪', { describe: '地址', parent: '二级'})
    // const { value: person} = useReactiveRecord({ name: '哇哈哈', address: '麓谷大道'}, { describe: '用户信息'})
    const consoleLog = () => {
        console.log(log())
    }
</script>

    
<style>
    
</style>