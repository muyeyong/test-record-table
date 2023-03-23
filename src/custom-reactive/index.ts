import { customRef, getCurrentInstance, getCurrentScope } from 'vue'

// 作用域的记录
/**
 *  返回当前组件所有的日志，包括子组件？
 */

/**
 *  变量的作用域
 *  可以返回变化记录, 返回多个，嵌套？ 返回同级 以及子级的log
 *  联合变量？ 表格？
 */
// value应该是 key value
const history = new Map()
const activeComponent = null

const record = (target: any, value: any) => {
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
}

export const logAll = () => {
    console.log(history)
}

export function useReactiveRecord<T> (value: T, describe?: string) {
    const log = () => {
        return history
    }
   const target = customRef((track, trigger) => {
    console.log('233', getCurrentInstance())
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
