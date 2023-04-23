<template>
    <a-select
    ref="select"
    v-model:value="value1"
    style="width: 120px"
    @focus="focus"
    @change="handleChange"
>
        <a-select-option value="jack">Jack</a-select-option>
        <a-select-option value="lucy">Lucy</a-select-option>
        <a-select-option value="disabled" disabled>Disabled</a-select-option>
        <a-select-option value="Yiminghe">yiminghe</a-select-option>
    </a-select>
    <a-select
      v-model:value="value2"
      :options="options"
      mode="multiple"
      placeholder="Please select"
      style="width: 200px"
      @popupScroll="popupScroll"
    ></a-select>
<a-button @click="consoleLog">打印日志</a-button>
<p v-html="logDetail"></p>
</template>
    
<script setup lang='ts'>
import { useOperatorLog } from '@/custom-reactive';
import { ref } from 'vue'
const { value: value1, log } = useOperatorLog('lucy', { describe: '基本下拉框'})
const { value: value2 } = useOperatorLog(['a1', 'b2'], { describe: '多选下拉框'})
const logDetail = ref('')

const options = ref( [...Array(25)].map((_, i) => ({ value: (i + 10).toString(36) + (i + 1) })))
const focus = () => {
    console.log('focus');
};

const popupScroll = () => {
      console.log('popupScroll');
    };

const consoleLog = () => {
    logDetail.value = log()
}
const handleChange = () => {

}
    
</script>

<script lang='ts'>
  export default {
    describe: '下拉选择Demo',
    inheritAttrs: false,
  }
</script>
    
<style>
    
</style>