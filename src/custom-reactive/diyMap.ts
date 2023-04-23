import { cloneDeep } from "lodash-es"
import { watch, ref,  unref, type Ref } from 'vue'
import type { DiyMap } from "./type"

/**
 * 那些地方需要自定义 { path: value }
 * 我传入一个值，这个值变动后，我能否获取最新的值
 */
const createDiyMap = (option: DiyMap) => {
    const { baseMap, rules } = option
    const createReturn = (diy: Array<Record<string, any>>) => {
        let diyMap = cloneDeep(baseMap)
        for(const item of diy) {
          for(const[path, value] of Object.entries(item)) {
            const pathArr = path.split('.')
            const lastKey = pathArr.pop()
            let tempMap: any = diyMap
            while(pathArr.length ) {
                const key = pathArr.shift()
                if (key === undefined) break
                tempMap = tempMap[key]
            }
            if (pathArr.length === 0  && lastKey !== undefined) {
                tempMap[lastKey] = unref(value) 
            }
          }
        }
        return diyMap
    }
    let result: { __diy: any} = { __diy: null}
    result.__diy = createReturn(rules)
    const mapRef = ref(rules)
    watch(mapRef, (value) => {
       result.__diy = createReturn(value)
    }, { deep: true})
   
    return result
}

export default createDiyMap