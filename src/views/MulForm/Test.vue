<template>
    <input v-model="count" />
</template>
    
<script setup lang='ts'>
import { ref } from 'vue';

const props = defineProps({
    count: Number
})
const count = ref(props.count)
</script>
    
<style></style>