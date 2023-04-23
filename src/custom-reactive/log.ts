import { cloneDeep } from "lodash-es"
import { analysis  } from "./analysis"
import { compare } from "./compare"
import { BASICDATAKEY, CHILDHISTORYFLAG, INGOREKEY, LOGANCHOR, ROOTDESCRIBE, ROOTLOG } from "./constant"
import { addEffectChange, handleValueMapConfig, polymer } from "./preProcess"
import type { ReactiveObjHistoryMap, ReactiveObjHistory, ComponentHistoryMap, ChildHistoryMap } from "./type"
import { filter } from "./utils"

let logType = 'default'
export const insertLog = (innerHtml: string, childInnerHtml: string) => {
    if (!childInnerHtml) return innerHtml
    const index = innerHtml.indexOf(LOGANCHOR) + LOGANCHOR.length
    return innerHtml.slice(0, index) + childInnerHtml + innerHtml.slice(index + 6)
}

export const setLogType = (type: string) => {
    logType = type
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
                const { changeDescribe, beforeModified, afterModified } = change
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
                                itemStr += `${key}${key !== "" ? ":" : ""}${value} `
                            }
                        }
                        return pre += (itemStr === "" ? "" : `${itemStr};`)
                    }, preStr)
                }
                const before = generateCompare(beforeModified, '')
                const after = generateCompare(afterModified, '')
                if (logType === 'default') {
                    // 输出全部
                    return `<div>
                        <p> ${changeDescribe} </p>
                        <div style="padding: 0 15px">
                            <p>变化前：${before}</p>
                            <p>变化后：${after}</p>
                        </div>
                   </div>`
                } else if (logType === 'beforeChange') {
                    return `<div>
                    <p>变化前：${before}</p>
                </div>`

                } else if (logType === 'afterChange') {
                    return `<div>
                    <p>${after}</p>
                </div>`

                }
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
        <h3>${rootDescribe}</h3>
        <div style="padding: 10px">
            ${rootLog}
            ${subLog}
            <div id="anchor"></div>
        </div>
    `
}

export const generateLog = (rootDescribe: string, logCombine: Map<string, Array<string>>) => {
    const subLogMap = filter(logCombine, (k, _v) => k !== ROOTLOG)
    return generateLogStruct(rootDescribe, logCombine.get(ROOTLOG) || [], subLogMap)
}

export const handleSelfHistory = <T = any>(selfHistory: ReactiveObjHistoryMap<T>) => {
    const logCombine = new Map()
    const rootDescribe = selfHistory.get(ROOTDESCRIBE) || ""
    selfHistory = filter(selfHistory, (k, _value) => k !== ROOTDESCRIBE)
    console.log('selfHistory', selfHistory)
    for (const log of selfHistory.values()) {
        const { parent = ROOTLOG, describe: dataDescribe = "" } = log
        const changes = handleReactiveHistory(log)
        const logDetail = { name: dataDescribe, changes }
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
    return generateLog(rootDescribe as unknown as string, logCombine)
}

export const handleReactiveHistory = <T = any>(log: ReactiveObjHistory<T>) => {
    const { value, signKey, keyMap, valueMap, valueMapConfig } = log
    const valueArr = [...value]
    const firstValue = valueArr[0]
    const lastValue = valueArr[valueArr.length - 1]
    const diff = compare(firstValue, lastValue, signKey || [])
    if (diff.length === 0) {
        return []
    }
    // 聚合处理，恢复层级结构
    const wrapDiff = polymer(diff)
    console.log('before', cloneDeep(wrapDiff))
    addEffectChange(wrapDiff)
    if(valueMapConfig) {
        handleValueMapConfig(wrapDiff, valueMapConfig, lastValue)
    }
    console.log('after', cloneDeep(wrapDiff))
    return analysis(wrapDiff, { oldObj: firstValue, newObj: lastValue }, signKey || [], keyMap, valueMap)
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
