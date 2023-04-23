import { cloneDeep } from "lodash-es"
import { watch, ref, toRaw, unref, isRef } from 'vue'

const baseValueMap = {
    type: {
        "1": "线下",
        "2": "促销",
        "3": "线上"
    },
    resource: {
        radio: {
            "1": "赞助人",
            "2": "场地"
        }
    },
    delivery: {
        "true": "是",
        "false": "否"
    }
}

/**
 * 那些地方需要自定义 { path: value }
 * 我传入一个值，这个值变动后，我能否获取最新的值
 */
const diyValueMap = (diyMapArr: Array<Record<string, any>>) => {
    const createReturn = (diy: Array<Record<string, any>>) => {
        let diyMap = cloneDeep(baseValueMap)
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
    result.__diy = createReturn(diyMapArr)
    const mapRef = ref(diyMapArr)
    watch(mapRef, (value) => {
       result.__diy = createReturn(value)
    }, { deep: true})
   
    return result
}

export default diyValueMap