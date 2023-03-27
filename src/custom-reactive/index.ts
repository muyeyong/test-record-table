import { getCurrentInstance, ref, watch, onBeforeUnmount, type ComponentInternalInstance, h, type DefineComponent, defineComponent, toRaw, type Ref, isRef } from 'vue'

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
 *  当一个组件被销毁的时候，注册内容要被清除  / 某些子组件数据并不需要注册到父级
 *  多个数据描述一个行为/单个数据描述一个行为
 *  理清数据结构==》 history 单个响应式数据 , 这个结构是否可以描述一个日志？
 * 
 */

const BASICDATAKEY = 'BASICDATAKEY'
const ROOTLOG = 'ROOTLOG'
const CHILDHISTORYFLAG = 'CHILDHISTORY'
const ROOTDESCRIBE = 'ROOTDESCRIBE'
const LOGANCHOR = '<div id="anchor">'

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

interface ReactiveObjHistory<T> extends Option {
    value: Array<T>
}

type ReactiveObjHistoryMap<T> = Map<Ref | string, ReactiveObjHistory<T>>
type ComponentHistoryMap<T> = ReactiveObjHistoryMap<T> | Map<string, ChildHistoryMap<T>>
type ChildHistoryMap<T> = Map<number, ComponentHistoryMap<T>>


const isObject = (val: any) => typeof val === 'object' && val !== null
const isSomeType = (val1: any, val2: any) => {
     if (isObject(val1) &&  isObject(val2) ) {
        return true
     } else if (!isObject(val1) && !isObject(val2)) {
        return typeof val1 === typeof val2
     }
     return false
}

function filter(map: Map<any, any>, pred: (k: any, v: any) => boolean) {
    const result = new Map();
    for (let [k, v] of map) {
      if (pred(k,v)) {
        result.set(k, v);
      }
    }
    return result;
  }
  
const equal = (value1: any, value2: any): boolean => {
    // 对象所有属性的值都是相同的
    if (!isSomeType(value1, value2)) {
        return false
    } else {
        if (isObject(value1) && isObject(value2)) {
           if ( Object.keys(value1).length !== Object.keys(value2).length) {
                return false
           }
           for(const key of Object.keys(value1)) {
                if (!(key in value2)) return false
           }
           for (const key of Object.keys(value1)) {
             const v1 = value1[key]
             const v2 = value2[key] 
             if (isSomeType(v1, v2)) {
                if (isObject(v1) && isObject(v2)) {
                    if(!equal(v1, v2)) return false
                } else {
                    if (v1 !== v2) return false
                }
             } else {
                return false
             }
           }
        } else {
            return value1 === value2
        }
    }
    return true
}

const compareObject = (obj1: object, obj2: object) => {

}
const compare = (oldValue: any, newValue: any): Partial<CompareResult> => {
    // 如果两者类型不一致，基本类型 跟 引用数据类型，直接退出
    // 只有一个值 ===> 没有变化
    // debugger
    const result: Partial<CompareResult> = {}
    if (newValue === oldValue) {
        // 没有变化，对于对象还需要处理
    } else {
        // 有两个值 ===> 发生了变化
       
        if (isSomeType(oldValue, newValue)) {
            // 嵌套对象的处理
            if(isObject(newValue)) {
                /*  对象的话处理每个属性的变化
                    以新值为基础，遍历新值的每个属性
                        新有老无 ==> 新增
                        新有老有 ==> 比较 ==> 判断修改
                    对于嵌套对象怎么处理？{ a: { b: { c: 1 }}} 
                */
               console.log('object change')
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
    console.log('analysis', addPart, deletePart, modifyPart )
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

const insertLog = (innerHtml: string, childInnerHtml: string) => {
    if (!childInnerHtml) return innerHtml
    const index = innerHtml.indexOf(LOGANCHOR) + LOGANCHOR.length - 1
    return innerHtml.slice(0, index) + childInnerHtml + innerHtml.slice(index + 1)
}

const generateLogStruct = (rootDescribe: string, rootLogArray: Array<string>, subLogMap?: Map<string, Array<string>>) => {
    let subLog = ''
    if (subLogMap) {
        for(const [key, value] of subLogMap.entries()) {
           subLog += `${generateLogStruct(key, value)}<br/>`
        }
    }
    return `
        <span>${rootDescribe}</span>
        <div style="padding: 10px">
            ${rootLogArray.join('<br/>')}<br>
            ${subLog}
            <div id="anchor"></div>
        </div>
    `
}

const generateLog = (rootDescribe: string, logCombine: Map<string, Array<string>>) => {
    // 目前只支持两级嵌套
    const subLogMap = filter(logCombine, (k, _v) => k !== ROOTLOG)
    return generateLogStruct(rootDescribe, logCombine.get(ROOTLOG) || [], subLogMap)
}

const handleSelfHistory = <T = any>(selfHistory: ReactiveObjHistoryMap<T>) => {
    const logCombine = new Map()
    const describe = selfHistory.get(ROOTDESCRIBE)
    selfHistory = filter(selfHistory, (k, _value) => k !== ROOTDESCRIBE)
    for (const log of selfHistory.values()) {
        const { parent = ROOTLOG } = log
        const res = handleReactiveHistory(log)
            if (res !== log.describe) {
            let logs = logCombine.get(parent)
            if (!logs) {
                logs = Array.of(res)
                logCombine.set(parent, logs)
            } else {
                logs.push(res)
            }
        }
    }
    return generateLog(describe as unknown as string, logCombine)
}

const handleReactiveHistory = <T = any>(log: ReactiveObjHistory<T>) => {
    const { value, describe, map } = log
    const valueArr = [...value]
    const firstValue = valueArr[0]
    const lastValue = valueArr[valueArr.length - 1 ]
    // 单个响应式数据处理
    // 解析值的变化, 生成描述日志
    return analysis(compare(firstValue, lastValue), describe, map)
}

const handleComponentHistory = <T = any>(componentHistory: ComponentHistoryMap<T>) => {
    const subComponentHistory = componentHistory.get(CHILDHISTORYFLAG) as ChildHistoryMap<T>
    const selfHistory = filter(componentHistory, (k, _v) => k !== CHILDHISTORYFLAG)
    const log1 = handleSelfHistory(selfHistory)
    // console.log('456', log1)
    const log2 = subComponentHistory && handleSubComponentHistory(subComponentHistory)
    // console.log('789', log2)
    // log2 需要嵌入 log1里面去
    return insertLog(log1, log2)
}
const handleSubComponentHistory = <T = any>(childHistory: ChildHistoryMap<T>) => {
        // 组件id => 子组件响应式数据，存在子组件嵌套
        let log =  ''
        for(let componentHistory of childHistory.values()) {
           log += handleComponentHistory(componentHistory)
        }
        return log
        // const subComponentHistory = childHistory.get(CHILDHISTORYFLAG)
        // // 当前组件的全部响应式数据
        // const selfHistory = filter(history, (k, v) => k !== CHILDHISTORYFLAG)
        // handleSelfHistory(selfHistory)
        // handleSubComponentHistory(subComponentHistory)
}

export function useReactiveRecord<T> (value: T, option: Option) {
    const instance = getCurrentInstance()
    let reportChildHistoryChange: any = null
    let history: any = null
    const refValue = ref(value)
    const listenChildHistory = (childHistory: Map<any, any>, instance: ComponentInternalInstance | null) => {
        // 监听子组件变化, 收集子组件数据变化, 记录子组件的每一个响应式对象
        // 结构变化一下 { '组件名': { 响应式对象集合 } }
        // 组件的描述定义在instance上
        let childHistoryCash = history.get(CHILDHISTORYFLAG)
        if (!childHistoryCash) {
            childHistoryCash = new Map()
            history.set(CHILDHISTORYFLAG, childHistoryCash)
        }
        childHistoryCash.set(instance?.uid, childHistory)
    }

    if (instance) {
        if (instance.props.history) {
            history = instance.props.history
        } else {
            instance.props.history = (history = new Map([[ROOTDESCRIBE, (instance.type as any).describe]]))
        }
        const { parent } = instance
        reportChildHistoryChange = parent?.props.reportChildHistory
        instance.props = {...instance?.props, reportChildHistory: listenChildHistory}
    }
  
    const log = () => {
    //    const logCombine = new Map()
       /* map的key存在三种情况： 
            数字 ==> 组件
            CHILDHISTORYFLAG ==> 子组件集合
            响应式对象 ==> 数据记录变化
       **/
        // 组件id => 子组件响应式数据，存在子组件嵌套
       const subComponentHistory = history.get(CHILDHISTORYFLAG)
       // 当前组件的全部响应式数据
       const selfHistory = filter(history, (k, v) => k !== CHILDHISTORYFLAG)
       const selfLog = handleSelfHistory(selfHistory)
       const subComponentLog = handleSubComponentHistory(subComponentHistory)
    //    console.log('subComponentLog', subComponentLog)
        // 对于describe一致的变量做集合处理
        // 1： 处理自身响应式数据
        // 2： 处理子组件响应式数据
        // for (const log of history.values()) {
        //     const { value, map, describe, parent = LOGROOT } = log
        //     const valueArr = [...value]
        //     const firstValue = valueArr[0]
        //     const lastValue = valueArr[valueArr.length - 1 ]
        //     // 单个响应式数据处理
        //     // 解析值的变化, 生成描述日志
        //   let res = analysis(compare(firstValue, lastValue), describe, map)
        //   if (res !== describe) {
        //     //TODO 
        //     let logs = logCombine.get(parent)
        //     if (!logs) {
        //         logs = Array.of(res)
        //         logCombine.set(parent, logs)
        //     } else {
        //         logs.push(res)
        //     }
        //    }
        //    console.log(logCombine)
            // 加入到describeCombine 中
        // }
        // 返回describeCombine ==> 处理结果
        return insertLog(selfLog, subComponentLog)
    }

    const record = (target: any, value: any) => {
        //TODO 还是要以当前组件作为target DOWN 响应式数据作为target
        let dep = history.get(target)
        // TODO 这里只是浅拷贝，嵌套对象还需要处理
        value = toRaw(value)
        value =  typeof value === 'object' && value !== null ? {...value} : value
        if (!dep) {
            dep = { ...option, value: new Set()}
            history.set(target, dep)
        }
        // dep是一个set，dep是一个对象 {...options, value: new Set()}
        //TODO 判断存在，如果是对象处理？
        //TODO 如果存在相同的数据，就进行回退，有这个必要性吗？
        //TODO 对象处理
        dep.value.add(value)
        reportChildHistoryChange && reportChildHistoryChange(history, instance)
    }
   
    record(refValue, value)
    watch(refValue, (newValue, _oldValue) => {
        // TODO 考虑对象的处理 equal处理
        // if (oldValue === newValue) return
        record(refValue, newValue)
    }, {  deep: true })
    return {
        value: refValue,
        log
    }
}

export function useIsolationRecord (wrapperComponent: DefineComponent<Record<string, unknown>>) {
   return defineComponent({
     setup() {

     },
     render() {
        return h(wrapperComponent)
     }
   })
}