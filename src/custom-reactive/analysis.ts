import type { CompareResult } from "./type"
import selfKeyMap from './keyMap.json'
import selfValueMap from './valueMap.json'
import { isEmptyObj, isObject, isValidKey } from "./utils"
import { ADDED, DELETED, INGOREKEY, MODIFIED, PARSEWILDCARD } from "./constant"

let diyKeyMap: object | null | undefined = null
let diyValueMap: object | null | undefined = null

const parseObjectKey = (fullPath: string) => {
    const keyMapArray = [diyKeyMap, selfKeyMap]
    const keyArr = fullPath.split('.')
    for (let i = 0; i < keyMapArray.length; i += 1) {
        let result = keyMapArray[i]
        if (!result) continue
        let j = 0
        for (j = 0; j < keyArr.length; j++) {
            const key = keyArr[j]
            if (isValidKey(key, result)) {
                result = result[key]
            } else if (isValidKey(PARSEWILDCARD, result)) {
                result = result[PARSEWILDCARD]
            } else {
                break
            }
        }
        if (j === keyArr.length) {
            return result
        }
    }
    return fullPath
}

const parseObjectValue = (keyFullPath: string, value: any) => {
    const parseSingleValue = (value: any) => {
        const keyArr: string[] = [...keyFullPath.split('.'), value]
        const valueMapArr = [diyValueMap, selfValueMap]
        for (let i = 0; i < valueMapArr.length; i += 1) {
            let result = valueMapArr[i]
            if (!result) continue
            let j = 0
            for (j = 0; j < keyArr.length; j++) {
                const key = keyArr[j]
                if (isValidKey(key, result)) {
                    result = result[key]
                } else if (isValidKey(PARSEWILDCARD, result)) {
                    result = result[PARSEWILDCARD]
                } else {
                    break
                }
            }
            if (j === keyArr.length) return result
        }
        return value
    }
    if (Array.isArray(value)) {
        return value.reduce((pre, next) => {
            return [].concat(pre, parseSingleValue(next))
        }, [])
    } else if (isObject(value) && !Array.isArray(value)) {
        let result: string[] = []
        Object.values(value).forEach(item => {
            result.push(parseSingleValue(item))
        })
        return result
    } else {
        return parseSingleValue(value)
    }
}

const parseHistoryPath = (key: string, targetObj: any, signKey: string) => {
    const historyPath = []
    let parentPath = ""
    let selfPath = ""
    if (!targetObj || !signKey) return ''
    const keyArr = key.split(".")
    for (let i = 0; i < keyArr.length; i += 1) {
        if (targetObj) {
            targetObj[signKey] ? historyPath.push(targetObj[signKey]) : ''
            targetObj = targetObj[keyArr[i]]
        }
    }
    while (historyPath.length >= 1) {
        parentPath += (parentPath !== "" ? `==>${historyPath.shift()}` : historyPath.shift())
        if (historyPath.length <= 1) break
    }
    if (historyPath.length) selfPath = historyPath.shift()
    return [parentPath, selfPath]
}

const changeValueIsObj = (key: string, targetObj: any) => {
    const keyArr = key.split(".")
    for (let i = 0; i < keyArr.length; i += 1) {
        if (targetObj) {
            targetObj = targetObj[keyArr[i]]
        }
    }
    return isObject(targetObj)
}

/**
 * history 是 diff的集合
 * 每一个diff都是描述单个值的变化，同一个对象，多个属性变动，会有多个diff产生
 *  {
 *     key: 描述整个对象, 最开始传入的 describe,
 *     originalObj: 新增、修改 取最新的值，删除取删除前的值 （父级的值）
 *     type: 删除 修改 增加
 *     value: { key: 修改值的路径, value: 值的变动 }
 *  }
 * 
 * 需要对于value.key进行处理
 *  key.xxx: []
 *  key.xxx.xxx: []
 *  xxx.xxx.key1  xxx.xxx.key2 都是同一个属性下的，需要收集
 */
export const analysis = (history: Array<CompareResult>, originalObj: any, signKey = 'key', keyMap?: object, valueMap?: object) => {
    diyKeyMap = keyMap
    diyValueMap = valueMap
    const result = []
    let oldKey: any = null
    const collect: Map<string, Array<CompareResult>> = new Map()
    history.forEach(item => {
        // 提前处理history
        const { key = '' } = item
        // 收集同一个对象的改动
        let target = collect.get(key)
        if (target) {
            target.push(item)
        } else {
            target = Array.of(item)
            collect.set(key, target)
        }
    })
    for (let [key, value] of collect.entries()) {
        // 每一个修改都有其对应的原始对象
        value.forEach(item => {
            oldKey = null
            for (const [modifyKey, modifyValue] of Object.entries(item.value)) {
                if (modifyKey === signKey) {
                    if (item.type === 'deleted') {
                        oldKey = modifyValue
                    } else if (item.type === 'modified') {
                        oldKey = (modifyValue as Array<any>)[0]
                    }
                    break
                }
            }
            let tempOriginalObj = null
            let targetObj = null
            if (item.type === 'deleted') {
                tempOriginalObj = originalObj.oldObj
            } else {
                tempOriginalObj = originalObj.newObj
            }
            if (Array.isArray(tempOriginalObj)) {
                targetObj = tempOriginalObj.find((item: any) => oldKey ? item[signKey] === oldKey : item[signKey] === key)
            } else if (isObject(tempOriginalObj)) {
                targetObj = tempOriginalObj
            }
            item.originalObj = targetObj
        })
        // 找出变化的差异
        const res = generateAnalysis(value, key, signKey)
        // 传入两个key，如果修改的值是signKey
        //TODO 如果signKey不存在的话，怎么处理
        const { beforeModified, afterModified } = generateParentAnalysis(originalObj, key, oldKey ? oldKey : key, signKey)

        result.push({
            beforeModified,
            afterModified,
            changePart: res,
            type: ''
        })
    }
    return result
}

const generateObjDescribe = (obj: any, parentPath: Array<string>): Array<any> => {
    let result = []
    let describeObj: any = {}
    let path: string[] = [...parentPath]
    for (const key in obj) {
        if (isObject(obj[key])) {
            path.push(key)
            result.push(...generateObjDescribe(obj[key], path))
            path.pop()
        } else {
            const fullPath = [...path, key].join('.')
            const parsedKey = parseObjectKey(fullPath)
            const parsedValue = parseObjectValue(fullPath, obj[key]) || '空'
            if ((parsedKey as any) in describeObj) {
                describeObj[parsedKey as any] =  Array.from(new Set([describeObj[parsedKey as any], parsedValue])).join('、')
            } else {
                describeObj[parsedKey as any] = parsedValue
            }

        }
    }
    if (!isEmptyObj(describeObj)) result.push(describeObj)
    return result
}

const generateParentAnalysis = (originalObj: any, newKey: string, oldKey: string, signKey: string) => {
    // 形容这个对象
    const { oldObj, newObj } = originalObj
    let beforeModified
    let afterModified
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
        // 在数组中找出对应的对象
        let oldTarget = oldObj.find((item: any) => item[signKey] === oldKey)
        let newTarget = newObj.find((item: any) => item[signKey] === newKey)
        if (!oldTarget && !oldKey && oldObj.every(item => !isObject(item))) oldTarget = oldObj
        if (!newTarget && !newKey && newObj.every(item => !isObject(item))) newTarget = newObj
        beforeModified = generateObjDescribe(oldTarget, [])
        afterModified = generateObjDescribe(newTarget, [])
    } else if (isObject(oldObj) && isObject(newObj)) {
        beforeModified = generateObjDescribe(oldObj, [])
        afterModified = generateObjDescribe(newObj, [])
    } else {
        beforeModified = [{ BASICDATAKEY: oldObj }]
        afterModified = [{ BASICDATAKEY: newObj }]
    }
    return { beforeModified, afterModified }

}
const generateAnalysis = (history: Array<CompareResult>, describe: string, signKey: string) => {
    const log = new Map()
    const resultMap = new Map()
    let result = ""
    // history 每一个修改的值
    history.forEach(item => {
        let { type, value, originalObj } = item
        if (!isObject(value)) value = { "0": value }
        for (let [fullPath, nextValue] of Object.entries(value)) {
            //TODO 还有问题, 这里是确定父级, 局限的话只能是二级，层次太对处理不了
            const [parentPath = "", selfHistory = ""] = parseHistoryPath(fullPath, originalObj, signKey)
            let targetLog = log.get(parentPath)
            if (!targetLog) {
                targetLog = new Map()
                log.set(parentPath, targetLog)
            }
            let parsedKey = ""
            let parsedValue = ""
            if (changeValueIsObj(fullPath, originalObj)) {
                parsedKey = (nextValue as any)[signKey]
                for (const [subPath, subValue] of Object.entries(nextValue as any)) {
                    const subFullPath = `${fullPath}.${subPath}`
                    const key1 = parseObjectKey(subFullPath)
                    if (key1 === INGOREKEY) continue
                    const value1 = parseObjectValue(subFullPath, subValue)
                    parsedValue += `${key1}: ${value1};`
                }
            } else {
                parsedKey = parseObjectKey(fullPath) as string
                parsedValue = parseObjectValue(fullPath, nextValue)
            }
            if (parsedKey === INGOREKEY) continue
            if (parsedValue === "") parsedValue = "空"
            const logDetailKey = selfHistory === "" ? parsedKey : selfHistory
            let logDetail = targetLog.get(logDetailKey)
            if (!logDetail) {
                logDetail = new Array()
                targetLog.set(logDetailKey, logDetail)
            }
            let logStr = ""
            // 全部是删除才是删除 全部是新增才是新增，其他的都是修改
            if (type === 'added') {
                logStr += `${ADDED}${logDetailKey === parsedKey ? "" : parsedKey + ':'}${parsedValue}`
            } else if (type === 'deleted') {
                logStr += `${DELETED}${logDetailKey === parsedKey ? "" : parsedKey + ':'}${parsedValue}`
            } else if (type === 'modified') {
                logStr += `${MODIFIED}${logDetailKey === parsedKey ? "" : parsedKey + ':'}从${(parsedValue as any)[0]}修改为${(parsedValue as any)[1]}`
            }
            logDetail.push(logStr)
        }
    })
    // console.log(log, describe)
    for (const [logKey, logValue] of log.entries()) {
        let isAdd = true
        let isDelete = true
        let logDetail: any = {}
        // 解析value,修改详细
        for (const [key, value] of logValue.entries()) {
            let itemLogDetail = ""
            for (let i = 0; i < value.length; i += 1) {
                if (value[i].includes(ADDED)) {
                    isDelete = false
                    itemLogDetail += `${value[i].replace(ADDED, "")}、`
                } else if (value[i].includes(DELETED)) {
                    isAdd = false
                    itemLogDetail += `${value[i].replace(DELETED, "")}、`
                } else if (value[i].includes(MODIFIED)) {
                    isAdd = false
                    isDelete = false
                    itemLogDetail += `${value[i].replace(MODIFIED, "")}、`
                }
            }
            
            logDetail[key] = (itemLogDetail.slice(-1)  === '、' ? itemLogDetail.slice(0, -1) : itemLogDetail) + ';'
        }
        let logDetailStr = ""
        for (let logDetailKey in logDetail) {
            logDetailStr += (`${logDetailKey ? logDetailKey + ":" : ""}${logDetail[logDetailKey]}`)
        }
        if (isDelete) {
            // 删除数据${key}，删除详细
            result = `删除${logKey}数据，删除详细： ${logDetailStr}`
        } else if (isAdd) {
            // 新增数据${key}，新增详细
            result = `新增${logKey}数据，新增详细：${logDetailStr}`
        } else {
            // 修改数据${key}，修改详细
            result = `修改${logKey}数据，修改详细：${logDetailStr}`
        }
    }
    return result
}
