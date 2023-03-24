import { customRef, getCurrentInstance, getCurrentScope, ref, triggerRef, watch } from 'vue'

// 作用域的记录
/**
 *  返回当前组件所有的日志，包括子组件？
 */

/**
 *  变量的作用域
 *  可以返回变化记录, 返回多个，嵌套？ 返回同级 以及子级的log
 *  联合变量？ 表格？
 */

/**
 * type?: 规定数据场景
 *  数据从一个状态变到另一个状态
 *  新增 ===> 数组对象，需要对新增的每一项做出说明（参考table的colum { key: 'name', value: '' }, 提供全局的查询字典 / 可读取自定义字典 / 可传入字典） / 单个值 / 单个对象（处理同数组对象）
 *  修改 ===> 改变部分的含义 选中、修改
 *  删除 ===> 那些删除并不需要记录？
 * describe: 场景描述, 相同的描述变成一个集合？
 * map?: 数据映射
 */
/**
 * TODO 
 *  联合数据场景
 *  传入的值是一个对象 ===> 比较处理？
 *  提供自定义场景处理
 *  嵌套对象的处理
 *  全局map
 * 
 */

const BASICDATAKEY = 'BASICDATAKEY'
const LOGROOT = 'LOGROOT'
interface Option {
    describe: string
    parent?: string
    type?: string
    map?: Map<string, string>
}

/**
 * 
 * @param oldValue 
 * @param newValue 
 * {
 *  modify: { modifyKey: [old, new ] }
 *  delete: { deleteKey: deleteValue  }
 *  add: { addKey: [...addValue ] }
 * }
 */
interface CompareResult {
    modifyPart: Record<string, Array<any>>
    deletePart: Record<string, any>
    addPart: Record<string, Array<any>>
}
const compare = (oldValue: any, newValue: any): Partial<CompareResult> => {
    // 如果两者类型不一致，基本类型 跟 引用数据类型，直接退出
    // 只有一个值 ===> 没有变化
    // debugger
    const result: Partial<CompareResult> = {}
    if (newValue === oldValue) {

    } else {
        // 有两个值 ===> 发生了变化
        const isObject = (val: any) => typeof val === 'object'
        const isSomeType = (val1: any, val2: any) => isObject(val1) === isObject(val2) 
        if (isSomeType(oldValue, newValue)) {
            // 嵌套对象的处理
            if(isObject(newValue)) {

            } else {
                // 基本数据类型处理, key全部是base
                const isEmptyBasicValue = (value:any) => value === null || value === '' || value === undefined
                if (isEmptyBasicValue(oldValue)) {
                    // 增加: oldValue为null undefined ''
                    result.addPart = { BASICDATAKEY: [newValue]}
                } else if (isEmptyBasicValue(newValue)) {
                      // 删除 newValue为null undefined ''
                      result.deletePart = { BASICDATAKEY: oldValue }
                } else {
                    // 修改
                    result.modifyPart = { BASICDATAKEY: [oldValue, newValue]}
                }
            }
        } else {
            // 不同类型，不能比较
        }
    }
    return result
}

const analysis = (args: Partial<CompareResult>, describe: string, map?: object): string => {
    const { addPart, deletePart, modifyPart } = args
    console.log(addPart, deletePart, modifyPart )
    // 如果是基本数据类型，只会存在上述一种情况
    let result = describe
    if (addPart) {
        Object.keys(addPart).forEach(key => {
            if (key === BASICDATAKEY) {
                result += `设置为${addPart[key].toString()};`
            } else {

            }
        })
    }
    if (modifyPart) {
        Object.keys(modifyPart).forEach(key => {
            if (key === BASICDATAKEY) {
                result += `:从${modifyPart[key][0]}修改为${modifyPart[key][1]};`
            } else {

            }
        })
    }
    if (deletePart) {
        Object.keys(deletePart).forEach(key => {
            if (key === BASICDATAKEY) {
                result += `:被清空，清空前的值为${deletePart[key]};`
            } else {

            }
        })
    }
    return result
}

const generateLog = () => {

}
export function useReactiveRecord<T> (value: T, option: Option) {
    const instance = getCurrentInstance()
    let reportHistoryChange: any = null
    let history: any = null
    const refValue = ref(value)
    const childHistoryChange = (childHistory: Map<any, any>) => {
        // 监听子组件变化, 收集子组件数据变化
        for(const [key, value] of childHistory.entries()) {
            // 如果key存在会执行更新的操作
            history.set(key, value)
        }
    }

    if (instance) {
        if (instance.props.history) {
            history = instance.props.history
        } else {
            instance.props.history = (history = new Map())
        }
        const { parent } = instance
        // 向上处理
        reportHistoryChange = parent?.props.reportHistoryChange
        instance.props = {...instance?.props, reportHistoryChange: childHistoryChange}
    }
  
    const log = () => {
       const logCombine = new Map()
        // 对于describe一致的变量做集合处理
        for (const log of history.values()) {
            const { value, map, describe, parent = LOGROOT } = log
            const valueArr = [...value]
            const firstValue = valueArr[0]
            const lastValue = valueArr[valueArr.length - 1 ]
            // 单个响应式数据处理
            // 解析值的变化, 生成描述日志
          let res = analysis(compare(firstValue, lastValue), describe, map)
          if (res !== describe) {
            //TODO 
            let logs = logCombine.get(parent)
            if (!logs) {
                logs = Array.of(res)
                logCombine.set(parent, logs)
            } else {
                logs.push(res)
            }
           }
           console.log(logCombine)
            // 加入到describeCombine 中
        }
        // 返回describeCombine ==> 处理结果
        return history
    }

    const record = (target: any, value: any) => {
        //TODO 还是要以当前组件作为target DOWN 响应式数据作为target
        // 有一个弹框弹出来，它记录的信息需要上报，关闭后，还需要上报信息
        let dep = history.get(target)
        if (!dep) {
            dep = { ...option, value: new Set()}
            history.set(target, dep)
        }
        // dep是一个set，dep是一个对象 {...options, value: new Set()}
        //TODO 判断存在，如果是对象处理？
        //TODO 如果存在相同的数据，就进行回退，有这个必要性吗？
        //TODO 对象处理
        dep.value.add(value)
        // if (dep.value.has(value)) {
        //    const newDep = new Set()
        //    for(let v of  dep.value.values()) {
        //      newDep.add(v)
        //      if(value === v) break
        //    }
        //    history.set(target, {...dep, value: newDep })
        // } else {
        //     dep.value.add(value)
        // }
        reportHistoryChange && reportHistoryChange(history)
    }
   
    record(refValue, value)
    watch(refValue, (oldValue, newValue) => {
        // TODO 考虑对象的处理 
        // if (oldValue === newValue) return
        debugger
        record(refValue, newValue)
    }, { immediate: true, deep: true })
    return {
        value: refValue,
        log
    }
}
