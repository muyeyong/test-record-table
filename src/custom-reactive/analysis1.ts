import type { CompareResult } from "./type"
import selfKeyMap from './keyMap.json'
import selfValueMap from './valueMap.json'
import { isEmptyObj, isObject, isValidKey } from "./utils"
import { ADDED, CHANGE, CHANGETYPE, DELETED, INGOREKEY, MODIFIED, NOPARSED, PARSEWILDCARD } from "./constant"

let diyKeyMap: object | null | undefined = null
let diyValueMap: object | null | undefined = null

const parseObjectKey = (fullPath: Array<string>) => {
    const keyMapArray = [diyKeyMap, selfKeyMap]
    for (let i = 0; i < keyMapArray.length; i += 1) {
        let result = keyMapArray[i]
        if (!result) continue
        let j = 0
        for (j = 0; j < fullPath.length; j++) {
            const key = fullPath[j]
            if (isValidKey(key, result)) {
                result = result[key]
            } else if (isValidKey(PARSEWILDCARD, result)) {
                result = result[PARSEWILDCARD]
            } else {
                break
            }
        }
        if (j === fullPath.length) {
            return isObject(result) ? "" : result
        }
    }
    return fullPath.join('.')
}

const parseObjectValue = (fullPath: Array<string>, value: any) => {
    const parseSingleValue = (path: Array<string>, value: any) => {
        const keyArr: string[] = [...path, value]
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
            return [].concat(pre, parseSingleValue(fullPath, next))
        }, [])
    } else if (isObject(value) && !Array.isArray(value)) {
        let result: string[] = []
        Object.keys(value).forEach(key => {
            result.push(parseSingleValue([...fullPath, key], value[key]))
        })
        return result
    } else {
        return parseSingleValue(fullPath, value)
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
const analysisChange = (changes: object, path: Array<string>, signKey: string, originalObj: any) => {
    let result: Array<any> = []
    for(const [changeKey, changeValue ] of Object.entries(changes)) {
        if (CHANGE in changeValue && CHANGETYPE in changeValue) {
            const { newObj, oldObj } = originalObj
            const fullPath = ([] as string[]).concat(path, changeKey)
            const type = changeValue[CHANGETYPE]
            const change = changeValue[CHANGE]
            const parsedKey = parseObjectKey(fullPath)
            if (parsedKey === INGOREKEY) continue
            const parsedValue = parseObjectValue(fullPath, change)
            const targetObj = type === 'deleted' ? oldObj : newObj
            const changeWholeObj = isObject(targetObj[changeKey]) ? true : false
            // 找到目标了
            // 修改整个对象(删除)访问路径返回的是一个对象
            // 修改对象的某些属性
            if (changeWholeObj) {
                // 只有删除的情况下，才会走这个分支, 需要解析整个对象
                let describeWholeObj: any = {}
                let describeWholeKey = targetObj[changeKey][signKey] || ""
                for (const[key, value] of Object.entries(targetObj[changeKey])) {
                    const currPath = [...fullPath, key ]
                    const k1 = parseObjectKey(currPath) as string
                    const v1 = parseObjectValue(currPath, value)
                    describeWholeObj[k1] = v1
                }
                result.push({ type, key: describeWholeKey, value: describeWholeObj })
            } else {
                // let prefix = ""
                // if (signKey !== "") {
                //     prefix = targetObj[signKey]
                // }
                result.push({ type, key: parsedKey, value: parsedValue })
            }
        } else {
            let { newObj, oldObj } = originalObj
            newObj = newObj[changeKey]
            oldObj = oldObj[changeKey]
            const selfValue = newObj ? newObj : oldObj
            const selfKey = signKey === "" ? NOPARSED : (selfValue[signKey] || NOPARSED)
           let target = result.find((item) => {
                item.key === selfKey
            })
            if (!target) {
                target = { key: selfKey, children: []}
                result.push(target)
            } 
            target.children = [].concat(target.children, ...analysisChange(changeValue, ([] as string[]).concat(path, changeKey), signKey, { newObj, oldObj }))
        }
    }
    return result
}


const describeSingleChange = (change: Map<string, Map<string, Array<string>>>) => {
    let result = ''
    const handleChangeValue = (changeValue: Array<any>) => {
        if (changeValue.every(item => !isObject(item))) {
            return changeValue.join(',')
        } else {
            return changeValue.reduce((pre, next) => {
                if (isObject(next)) {
                    const arr: string[] = []
                    Object.keys(next).forEach(key => {
                        arr.push(`${key}:${next[key]}`)
                    })
                    pre += (arr.join(','))
                } else {
                    pre += next
                }
                return pre
            }, "")
        }
    }
    for(const [key, value] of change) {
        const addedValue = handleChangeValue(value.get(ADDED) || [])
        const modifiedValue = handleChangeValue(value.get(MODIFIED) || [])
        const deleteValue = handleChangeValue(value.get(DELETED) || [])
        if (!addedValue && !modifiedValue && !deleteValue) continue
        const initValue = `${key}:\n`
        let itemStr = initValue
        if (addedValue) {
            itemStr += ` 新增: ${addedValue}`
        }
        if (modifiedValue) {
            if (itemStr !== initValue) result += '、'
            itemStr += ` 修改:${modifiedValue}`
        }
        if (deleteValue) {
            if (itemStr !== initValue) result += '、'
            itemStr += ` 删除:${deleteValue}`
        }
        result += (`${itemStr};\n`)
    }
    return result
}
const describeChange = (changes: Array<any>): string => {
    const collect = new Map()
    let result = ""
    for (let i = 0; i < changes.length; i += 1) {
        const { key, children, type } = changes[i]
        let describeValue = collect.get(key)
        const isChangePart = ['added', 'deleted', 'modified'].includes(type)
        if (!describeValue) {
            describeValue = new Map()
            collect.set(key, describeValue)
        }
        if ( key !== NOPARSED && !isChangePart) {
            result += `${key}\n`
        }
        if (isChangePart) {
            const {type, value} = changes[i]
            let describeStr = ""
            if ( type === 'added') {
                let addValue = describeValue.get(ADDED)
                if (!addValue) {
                    addValue = new Array()
                    describeValue.set(ADDED, addValue)
                }
                describeStr = value
                addValue.push(describeStr)
            } else if ( type === 'modified') {
                let modifiedValue = describeValue.get(MODIFIED)
                if (!modifiedValue) {
                    modifiedValue = new Array()
                    describeValue.set(MODIFIED, modifiedValue)
                }
                describeStr = `从${value[0]}修改成${value[1]}`
                modifiedValue.push(describeStr)
            } else if( type === 'deleted') {
                let deletedValue = describeValue.get(DELETED)
                if (!deletedValue) {
                    deletedValue = new Array()
                    describeValue.set(DELETED, deletedValue)
                }
                describeStr = value
                deletedValue.push(describeStr)
            }
        }
        if (children) {
            const str = describeChange(children)
           result += str === "" ? ('\n' + str) : str
        }
    }
    const str = describeSingleChange(collect)
    result += str === "" ? ('\n' + str) : str
    return result
}

const getAllChangePath = (changes: object, path: Array<string>) => {
    let result: Array<any> = []
    for(const [changeKey, changeValue] of Object.entries(changes)) {
        if ( CHANGETYPE in changeValue && CHANGE in changeValue) {
            return [...path, changeKey].join('.')
        } else {
           result.push(getAllChangePath(changeValue, [...path, changeKey])) 
        }
    }
    return result
}
const analysisParentChange= (changes: object, originalObj: { newObject: any, oldObj: any}) => {
    const allChangePath = getAllChangePath(changes, [])
    // console.log(allChangePath)
}
export const analysis = (history: any, originalObj: any, signKey = '', keyMap?: object, valueMap?: object) => {
    diyKeyMap = keyMap
    diyValueMap = valueMap
    const result = []
    const collect: Map<string, Array<CompareResult>> = new Map()
    // TODO 返回一个对象
    const changeDescribe = describeChange(analysisChange(history, [], signKey, originalObj))
    console.log(changeDescribe)
    // 描述父级状况
    // 通过history找出所有的修改路径，存在多条取最长公共子串，存在一条做特殊判断
    analysisParentChange(history, originalObj)
    // const beforeModified = ''
    // const afterModified = ''
    // console.log(originalObj, changeDescribe)
//    console.log(res)

//    describeChange(res)
    // history.forEach(item => {
    //     // 提前处理history
    //     const { key = '' } = item
    //     // 收集同一个对象的改动
    //     let target = collect.get(key)
    //     if (target) {
    //         target.push(item)
    //     } else {
    //         target = Array.of(item)
    //         collect.set(key, target)
    //     }
    // })
    // for (let [key, value] of collect.entries()) {
    //     // 每一个修改都有其对应的原始对象
    //     value.forEach(item => {
    //         oldKey = null
    //         for (const [modifyKey, modifyValue] of Object.entries(item.value)) {
    //             if (modifyKey === signKey) {
    //                 if (item.type === 'deleted') {
    //                     oldKey = modifyValue
    //                 } else if (item.type === 'modified') {
    //                     oldKey = (modifyValue as Array<any>)[0]
    //                 }
    //                 break
    //             }
    //         }
    //         let tempOriginalObj = null
    //         let targetObj = null
    //         if (item.type === 'deleted') {
    //             tempOriginalObj = originalObj.oldObj
    //         } else {
    //             tempOriginalObj = originalObj.newObj
    //         }
    //         if (Array.isArray(tempOriginalObj)) {
    //             targetObj = tempOriginalObj.find((item: any) => oldKey ? item[signKey] === oldKey : item[signKey] === key)
    //         } else if (isObject(tempOriginalObj)) {
    //             targetObj = tempOriginalObj
    //         }
    //         item.originalObj = targetObj
    //     })
    //     // 找出变化的差异
    //     const res = generateAnalysis(value, key, signKey)
    //     // 传入两个key，如果修改的值是signKey
    //     //TODO 如果signKey不存在的话，怎么处理
    //     const { beforeModified, afterModified } = generateParentAnalysis(originalObj, key, oldKey ? oldKey : key, signKey)

    //     result.push({
    //         beforeModified,
    //         afterModified,
    //         changePart: res,
    //         type: ''
    //     })
    // }
    // return result
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
