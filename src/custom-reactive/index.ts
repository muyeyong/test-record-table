import { customRef, getCurrentInstance, getCurrentScope, watch } from 'vue'

// 作用域的记录
/**
 *  返回当前组件所有的日志，包括子组件？
 */

/**
 *  变量的作用域
 *  可以返回变化记录, 返回多个，嵌套？ 返回同级 以及子级的log
 *  联合变量？ 表格？
 */

export function useReactiveRecord<T> (value: T, describe?: string) {
    const instance = getCurrentInstance()
    if (!instance) return
    let history: any = null
    if (instance.props.history) {
        history = instance.props.history
    } else {
        instance.props.history = (history = new Map())
    }
    let reportHistoryChange: any = null
    const log = () => {
        return history
    }
    const childHistoryChange = (childHistory: Map<any, any>) => {
        // 监听子组件变化
        console.log('childHistoryChange:', history, childHistory)
        for(const [key, value] of childHistory.entries()) {
            if (history.has(key)) {
                // 更新
            } else {
                // 添加
                history.set(key, value)
            }
        }
        console.log(history)
        // history = new Map([...history, ...childHistory])
    }
    const record = (target: any, value: any) => {
        // debugger
        //TODO 还是要以当前组件作为target
        // 有一个弹框弹出来，它记录的信息需要上报，关闭后，还需要上报信息
        let dep = history.get(target)
        if (!dep) {
            dep = new Set()
            history.set(target, dep)
        }
        if (dep.has(value)) {
           const newDep = new Set()
           for(let v of  dep.values()) {
             newDep.add(v)
             if(value === v) break
           }
           history.set(target, newDep)
        } else {
            dep.add(value)
        }
        reportHistoryChange && reportHistoryChange(history)
    }
   
    const { parent } = instance
    // console.log(instance)
    // 向上处理
    reportHistoryChange = parent?.props.reportHistoryChange
    instance.props = {...instance.props, reportHistoryChange: childHistoryChange}
 
    // console.log('instance', instance.props)
    // 需要将子组件的history引入
   const target = customRef((track, trigger) => {
    return {
        get() {
            track()
            record(target, value)
            return value
        },
        set(newValue) {
            value = newValue
            // record(target, newValue)
            trigger()
        }
    }
})
    return {
        value: target,
        log
    }
}
