import { analysis } from "./analysis"
import { analysis as analysis2 } from "./analysis1"
import { compare } from "./compare"
import { compare as compare2 } from "./compare2"
import { BASICDATAKEY, CHILDHISTORYFLAG, INGOREKEY, LOGANCHOR, ROOTDESCRIBE, ROOTLOG } from "./constant"
import { polymer } from "./polymer"
import type { ReactiveObjHistoryMap, ReactiveObjHistory, ComponentHistoryMap, ChildHistoryMap } from "./type"
import { filter, isArrayObject, translateArrayLike } from "./utils"

export const insertLog = (innerHtml: string, childInnerHtml: string) => {
    if (!childInnerHtml) return innerHtml
    const index = innerHtml.indexOf(LOGANCHOR) + LOGANCHOR.length - 1
    return innerHtml.slice(0, index) + childInnerHtml + innerHtml.slice(index + 1)
}

const generateLogStruct = (rootDescribe: string, rootLogArray: Array<any>, subLogMap?: Map<string, Array<string>>) => {
    let subLog = ''
    let rootLog = ''
    if (subLogMap) {
        for (const [key, value] of subLogMap.entries()) {
            subLog += `${generateLogStruct(key, value)}<br/>`
        }
    }
    if (rootLogArray) {
        const res = rootLogArray.map(item => {
            const { name, changes } = item
            const changesLog = changes.map((change: any) => {
                const { changePart, beforeModified, afterModified } = change
                const generateCompare = (change: Array<any>, preStr: string) => {
                    return change.reduce((pre: string, next: object) => {
                        let itemStr = ""
                        for (const [key, value] of Object.entries(next)) {
                            if (key === BASICDATAKEY) {
                                itemStr += value
                            } else if (key === INGOREKEY) {
                                continue
                            }
                            else {
                                itemStr += `${key}:${value} `
                            }
                        }
                        return pre += (itemStr === "" ? "" : `${itemStr};`)
                    }, preStr)
                }
                const before = generateCompare(beforeModified, '变化前 => ')
                const after = generateCompare(afterModified, '变化后 => ')
                return `<div>
                    <p> ${changePart} </p>
                    <div style="padding: 0 15px">
                        <p>${before}</p>
                        <p>${after}</p>
                    </div>
               </div>`
            })
            return `
                <div>
                    <h4>${name}</h4>
                    <div>${changesLog.join("")}</div>
                </div>
            `
        })
        rootLog = res.join("")
    }
    return `
        <span>${rootDescribe}</span>
        <div style="padding: 10px">
        ${rootLog}
        ${subLog}
            <div id="anchor"></div>
        </div>
    `
}

export const generateLog = (rootDescribe: string, logCombine: Map<string, Array<string>>) => {
    // 目前只支持两级嵌套
    const subLogMap = filter(logCombine, (k, _v) => k !== ROOTLOG)
    return generateLogStruct(rootDescribe, logCombine.get(ROOTLOG) || [], subLogMap)
}

export const handleSelfHistory = <T = any>(selfHistory: ReactiveObjHistoryMap<T>) => {
    const logCombine = new Map()
    const describe = selfHistory.get(ROOTDESCRIBE)
    selfHistory = filter(selfHistory, (k, _value) => k !== ROOTDESCRIBE)
    for (const log of selfHistory.values()) {
        const { parent = ROOTLOG, describe } = log
        // TODO 根据parent还需要组装， 可能会有多个值描述的组合
        const changes = handleReactiveHistory(log)
        const logDetail = { name: describe, changes }
        if (changes.length > 0) {
            let logs = logCombine.get(parent)
            if (!logs) {
                logs = Array.of(logDetail)
                logCombine.set(parent, logs)
            } else {
                logs.push(logDetail)
            }
        }
    }
    return generateLog(describe as unknown as string, logCombine)
}

export const handleReactiveHistory = <T = any>(log: ReactiveObjHistory<T>) => {
    // 如果是数组对象的话，需要指定一个key去代表对象
    // TODO  前缀描述 or 传入一个处理函数
    const { value, describe, signKey, keyMap, valueMap } = log
    const valueArr = [...value]
    // 这个对象下存在多个对象 ?
    const firstValue = valueArr[0]
    const lastValue = valueArr[valueArr.length - 1]
    // const firstValue = isArrayObject(valueArr[0]) ? translateArrayLike(valueArr[0]) : valueArr[0]
    // const lastValue = isArrayObject(valueArr[valueArr.length - 1]) ? translateArrayLike(valueArr[valueArr.length - 1]) : valueArr[valueArr.length - 1]
    // 单个响应式数据处理
    // 解析值的变化, 生成描述日志
    //TODO 如果没有变化不继续
    const diff = compare(firstValue, lastValue, signKey)
    const diff2 = compare2(firstValue, lastValue, signKey)
    // console.log('diff2', diff2)
    const wrapDiff = polymer(diff2)
    //TODO 需要返回 变化部分 原始描述 改变描述
    analysis2(wrapDiff, { oldObj: firstValue, newObj: lastValue }, signKey, keyMap, valueMap)
    return analysis(diff, { oldObj: firstValue, newObj: lastValue }, signKey, keyMap, valueMap)
}

export const handleComponentHistory = <T = any>(componentHistory: ComponentHistoryMap<T>) => {
    const subComponentHistory = componentHistory.get(CHILDHISTORYFLAG) as ChildHistoryMap<T>
    const selfHistory = filter(componentHistory, (k, _v) => k !== CHILDHISTORYFLAG)
    const log1 = handleSelfHistory(selfHistory)
    const log2 = subComponentHistory && handleSubComponentHistory(subComponentHistory)
    return insertLog(log1, log2)
}
export const handleSubComponentHistory = <T = any>(childHistory: ChildHistoryMap<T>) => {
    // 组件id => 子组件响应式数据，存在子组件嵌套
    if (!childHistory) return ''
    let log = ''
    for (let componentHistory of childHistory.values()) {
        log += handleComponentHistory(componentHistory)
    }
    return log
}
