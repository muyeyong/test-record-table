import { getCurrentInstance, ref, watch, type ComponentInternalInstance, toRaw, provide, inject, unref, computed, effect } from 'vue'
import { CHILDHISTORYFLAG, INJECTIONKEY, ROOTDESCRIBE, WRAPVALUEKEY } from './constant'
import { handleSelfHistory, handleSubComponentHistory, insertLog, setLogType } from './log'
import type { Option, DiyMap } from './type'
import { addSignKey, filter, isNestObj, refreshHistory } from './utils'
import { cloneDeep } from 'lodash-es'
import { parse } from './parse'
import selfKeyMap from './keyMap.json'
import selfValueMap from './valueMap.json'
import reactiveLog from './logObj'
import createDiyMap from './diyMap'
import { collectEffect } from './preProcess'
import effectChange from './effectChange'

/**
 * 
 * signKey 可能不是唯一的，对应值也因该放到keyMap里面
 *  signKey变成一个数组？
 *  keyMap里面专门写一个key为 signKey: { xxx: xxx }
 *  
 * keyMap 和 valueMap结构需要优化
 *  keyMap、valueMap传入的是一层结构 或者是传入任意层次结构
 *  层次结构统一成 两层 or 一层，也不需要通配符之类的了
 * 刷新的问题，只刷新当前值还是说刷新全部？
 * 
 * 对于数组还是缺少判断两者相等
 *  可以指定signKey，然后会将signKey的值进行一个拷贝，这个拷贝的值就代表这个数组
 * 位置变化：修改伴随位置变化，怎么处理
 *  1：修改 & 移动位置
 *  2：修改 & 移动位置
 * valueMap需要做成一个动态的
 *  1: 动态的部分是额外的响应式数据，根据这个数据动态生成valueMap
 *  2：动态的部分包含在value里面，需要传入配置
 */
export function useOperatorLog<T>(value: T, option?: Option) {
    const instance = getCurrentInstance()
    let reportChildHistoryChange: any = null
    let history: any = null
   
    const listenChildHistory = (childHistory: Map<any, any>, childInstance: ComponentInternalInstance | null) => {
        let childHistoryCash = history.get(CHILDHISTORYFLAG)
        if (!childHistoryCash) {
            childHistoryCash = new Map()
            history.set(CHILDHISTORYFLAG, childHistoryCash)
        }
        childHistoryCash.set(childInstance?.uid, childHistory)
    }

    if (instance) {
        if (option?.individual) {
            history = new Map([[ROOTDESCRIBE, (instance.type as any).describe]])
        } else {
            if (instance.props.history) {
                history = instance.props.history
            } else {
                instance.props.history = (history = new Map([[ROOTDESCRIBE, (instance.type as any).describe]]))
            }
            reportChildHistoryChange = inject(INJECTIONKEY)
        }
        provide(INJECTIONKEY, listenChildHistory)
    }

    const refValue = reactiveLog(addSignKey(value)) 

    const log = (type = "default") => {
        setLogType(type)
        const subComponentHistory = history.get(CHILDHISTORYFLAG)
        const selfHistory = filter(history, (k, v) => k !== CHILDHISTORYFLAG)
        const selfLog = handleSelfHistory(selfHistory)
        const subComponentLog = handleSubComponentHistory(subComponentHistory)
        if ( option?.refreshRecord === false ) {
            return insertLog(selfLog, subComponentLog)
        } else {
            refreshHistory(history)
            return insertLog(selfLog, subComponentLog)
        }
    }

    const refreshRecord = () => {
        refreshHistory(history)
    }

    const parsedObj = (parseOption: {
        translateKey?: boolean,
        translateValue?: boolean
    } = {}) => {
        const {
            translateKey = false,
            translateValue = true
        } = parseOption
        const rawObj = toRaw(refValue.value)
        return parse(rawObj, translateKey? [ selfKeyMap, option?.keyMap] : [],  translateValue? [ selfValueMap, option?.valueMap] : [])
    }

    const record = (target: any, value: any) => {
        let dep = history.get(target)
        let cloneValue = cloneDeep(toRaw(value))
        cloneValue = isNestObj(cloneValue) ? cloneValue: {[ WRAPVALUEKEY]: cloneValue}
        if (!dep) {
            dep = { ...option, value: new Array() }
            history.set(target, dep)
        }
        dep.value.push(cloneValue)
        reportChildHistoryChange && reportChildHistoryChange(history, instance)
    }

    if (option?.valueMapConfig) {
        collectEffect(option.valueMapConfig)
    }
    console.log(effectChange.getEffect())
    record(refValue, value)
    watch(refValue, (newValue, _oldValue) => {
        record(refValue, newValue)
    }, { deep: true })

    return {
        value: refValue,
        log,
        parsedObj,
        refreshRecord
    }
}
