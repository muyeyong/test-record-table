import { getCurrentInstance, ref, watch, type ComponentInternalInstance, h, defineComponent, toRaw, type Component, provide, inject } from 'vue'
import { CHILDHISTORYFLAG, INJECTIONKEY, ROOTDESCRIBE } from './constant'
import { handleSelfHistory, handleSubComponentHistory, insertLog } from './log'
import type { Option } from './type'
import { filter } from './utils'
import { cloneDeep, isEqual } from 'lodash-es'
//TODO 分页后数据的处理
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
 *  理清数据结构==》 history 单个响应式数据 , 这个结构是否可以描述一个日志？ DOWN 不需要清理数据
 *  可提供需要导出的日志类型： 纯文本 html元素等
 *  解析key有些key可以设置成忽略
 *  当表单数据更新（重新发送请求 or 分页），需不需要处理
 *  打印完日志需要提供刷新，之前的记录全部抛弃？
 *  主要的话还是处理表单 跟 表格
 *      对于表单以lable: 修改部分 修改前的值 修改后的值的形式输出
 *      对于表格以html输出 修改部分 <table> .... <table> 新增 修改 删除给不同的标记
 *  对于判断数据是新增还是修改还是删除这个部分需要完善，一个数据既可以新增也可以删除和修改
 *  表单： label 对应多选的情况
 * 
 *  使用props传递改变函数，如果不是父子组件不会收集依赖, 使用provide 和 inject解决，但还需要处理不需要在当前组件上报日志
 * 
 */
/**
 * 
 * 需要输出的日志：
 *  包含变化部分：新增 修改 删除，需要记录修改前修改后的值
 *      新增一项，新增前的值，新增后的值为： 在xxx中，删除了xxx，删除前的值为，删除后的值为
 *      删除一项，删除前的值，删除后的值为
 *      修改一项，修改前的值，修改后的值为
 * 
 *  根据变化路径来处理：修改部分的的描述，谁修改了（描述父级），修改了什么内容（描述子级）
 *  变化的是某一项 还是 全部？
 *  
 */
export function useReactiveRecord<T>(value: T, option: Option) {
    const instance = getCurrentInstance()
    let reportChildHistoryChange: any = null
    let history: any = null
    const refValue = ref(value)
    const listenChildHistory = (childHistory: Map<any, any>, instance: ComponentInternalInstance | null) => {
        let childHistoryCash = history.get(CHILDHISTORYFLAG)
        if (!childHistoryCash) {
            childHistoryCash = new Map()
            history.set(CHILDHISTORYFLAG, childHistoryCash)
        }
        childHistoryCash.set(instance?.uid, childHistory)
    }

    if (instance) {
        if (option.individual) {
            history = new Map([[ROOTDESCRIBE, (instance.type as any).describe]])
        } else {
            if (instance.props.history) {
                history = instance.props.history
            } else {
                instance.props.history = (history = new Map([[ROOTDESCRIBE, (instance.type as any).describe]]))
            }
            reportChildHistoryChange = inject(INJECTIONKEY)
        }
       
        // const { parent } = instance
        // instance.props = { ...instance?.props, reportChildHistory: listenChildHistory }
        provide(INJECTIONKEY, listenChildHistory)
    }

    const log = () => {
        // TODO 优化，逻辑可以放到log文件里面去
        const subComponentHistory = history.get(CHILDHISTORYFLAG)
        const selfHistory = filter(history, (k, v) => k !== CHILDHISTORYFLAG)
        const selfLog = handleSelfHistory(selfHistory)
        const subComponentLog = handleSubComponentHistory(subComponentHistory)
        //    if (selfHistory) {
        //     // 输出日志之后，清除之前的值
        //     for(const [key, value] of selfHistory.entries()) {
        //         if (key === ROOTDESCRIBE) continue
        //         const latestValue = value.value[value.value.length - 1]
        //         value.value = [ latestValue ]
        //     }
        //    }
        return insertLog(selfLog, subComponentLog)
    }

    const record = (target: any, value: any) => {
        //TODO 还是要以当前组件作为target DOWN 响应式数据作为target
        let dep = history.get(target)
        // TODO 这里只是浅拷贝，嵌套对象还需要处理
        const cloneValue = cloneDeep(toRaw(value))
        if (!dep) {
            dep = { ...option, value: new Array() }
            history.set(target, dep)
        }
        // dep是一个set，dep是一个对象 {...options, value: new Set()}
        //TODO 判断存在，如果是对象处理？
        //TODO 如果存在相同的数据，就进行回退，有这个必要性吗？
        //TODO 对象处理
        dep.value.push(cloneValue)
        // const res = inject('listenChildHistory')
        // console.log('inject', res, instance)
        // 向上收集
        reportChildHistoryChange && reportChildHistoryChange(history, instance)
    }

    record(refValue, value)
    watch(refValue, (newValue, oldValue) => {
        // DOWN 考虑对象的处理 equal处理
        // if (isEqual(oldValue, newValue)) return
        record(refValue, newValue)
    }, { deep: true })
    return {
        value: refValue,
        log
    }
}

export function useIsolationRecord(wrapperComponent: Component) {
    return defineComponent({
        setup() {

        },
        render() {
            return h(wrapperComponent)
        }
    })
}