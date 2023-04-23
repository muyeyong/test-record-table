import type { CompareResult } from "./type"
import selfKeyMap from './keyMap.json'
import selfValueMap from './valueMap.json'
import { isEmptyObj, isObject, isValidKey, parseObjectKey, parseObjectValue } from "./utils"
import { ADDED, CHANGE, CHANGETYPE, DELETED, INGOREKEY, MODIFIED, NOPARSED, PARSEWILDCARD } from "./constant"
import { cloneDeep } from 'lodash-es'

let diyKeyMap: object | null | undefined = null
let diyValueMap: object | null | undefined = null


const analysisChange = (changes: object, path: Array<string>, signKey: string, originalObj: any) => {
    let result: Array<any> = []
    for (const [changeKey, changeValue] of Object.entries(changes)) {
        if (CHANGE in changeValue && CHANGETYPE in changeValue) {
            const { newObj = {}, oldObj = {} } = originalObj
            const fullPath = ([] as string[]).concat(path, changeKey)
            const type = changeValue[CHANGETYPE]
            const change = changeValue[CHANGE]
            const parsedKey = parseObjectKey(fullPath, [diyKeyMap, selfKeyMap])
            if (parsedKey === INGOREKEY) continue
            const parsedValue = parseObjectValue(fullPath, change, [diyValueMap, selfValueMap])
            const targetObj = type === 'deleted' ? oldObj : newObj
            const changeWholeObj = isObject(targetObj[changeKey]) ? true : false
            // 找到目标了
            // 修改整个对象(删除)访问路径返回的是一个对象
            // 修改对象的某些属性
            if (changeWholeObj) {
                // 只有删除的情况下，才会走这个分支, 需要解析整个对象
                let describeWholeObj: any = {}
                let describeWholeKey = targetObj[changeKey][signKey] || ""
                for (const [key, value] of Object.entries(targetObj[changeKey])) {
                    const currPath = [...fullPath, key]
                    const k1 = parseObjectKey(currPath, [diyKeyMap, selfKeyMap]) as string
                    const v1 = parseObjectValue(currPath, value, [diyValueMap, selfValueMap])
                    describeWholeObj[k1] = v1
                }
                result.push({ type, key: describeWholeKey, value: describeWholeObj, originalObj: { oldObj: oldObj[changeKey], newObj: newObj[changeKey] } })
            } else {
                result.push({ type, key: parsedKey, value: parsedValue, originalObj: { oldObj: parseObjectValue(fullPath, oldObj[changeKey], [diyValueMap, selfValueMap]) , newObj: parseObjectValue(fullPath, newObj[changeKey], [diyValueMap, selfValueMap])} })
            }
        } else {
            const { newObj, oldObj } = originalObj
            const nextNewObj = newObj[changeKey]
            const nextOldObj = oldObj[changeKey]
            const selfValue = nextNewObj ? nextNewObj : nextOldObj
            const selfKey = signKey === "" ? NOPARSED : (selfValue[signKey] || NOPARSED)
            let target = result.find((item) => {
                item.key === selfKey
            })
            if (!target) {
                target = { key: selfKey, originalObj: { oldObj: { [changeKey]: cloneDeep(nextOldObj) }, newObj: { [changeKey]: cloneDeep(nextNewObj) } }, children: [] }
                result.push(target)
            }
            target.children = [].concat(target.children, ...analysisChange(changeValue, ([] as string[]).concat(path, changeKey), signKey, { newObj: nextNewObj, oldObj: nextOldObj }))
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
    for (const [key, value] of change) {
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
            const fullPath = [...path, key]
            const parsedKey = parseObjectKey(fullPath, [diyKeyMap, selfKeyMap])
            if (parsedKey === INGOREKEY) continue
            const parsedValue = parseObjectValue(fullPath, obj[key], [diyValueMap, selfKeyMap]) || '空'
            if ((parsedKey as any) in describeObj) {
                describeObj[parsedKey as any] = Array.from(new Set([describeObj[parsedKey as any], parsedValue])).join('、')
            } else {
                describeObj[parsedKey as any] = parsedValue
            }

        }
    }
    if (!isEmptyObj(describeObj)) result.push(describeObj)
    return result
}
const describeWholeObj = (originalObj: any) => {
    let beforeModified: Array<any> = []
    let afterModified: Array<any> = []
    const { newObj, oldObj } = originalObj
    // 先找到变化的对象
    if (isObject(newObj) && isObject(oldObj)) {
        beforeModified = generateObjDescribe(oldObj, [])
        afterModified = generateObjDescribe(newObj, [])
    } else {
        beforeModified = [{ BASICDATAKEY: oldObj }]
        afterModified = [{ BASICDATAKEY: newObj }]
    }
    return { beforeModified, afterModified }
}
const describeChange = (changes: Array<any>): string => {
    //TODO 如果每一项都是新增 or 删除，统一处理
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
        if (key !== NOPARSED && !isChangePart) {
            result += `${key}\n`
        }
        if (isChangePart) {
            const { type, value } = changes[i]
            let describeStr = ""
            if (type === 'added') {
                let addValue = describeValue.get(ADDED)
                if (!addValue) {
                    addValue = new Array()
                    describeValue.set(ADDED, addValue)
                }
                describeStr = value
                addValue.push(describeStr)
            } else if (type === 'modified') {
                let modifiedValue = describeValue.get(MODIFIED)
                if (!modifiedValue) {
                    modifiedValue = new Array()
                    describeValue.set(MODIFIED, modifiedValue)
                }
                describeStr = `从${value[0]}修改成${value[1]}`
                modifiedValue.push(describeStr)
            } else if (type === 'deleted') {
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


export const analysis = (history: any, originalObj: any, signKey = '', keyMap?: object, valueMap?: object) => {
    diyKeyMap = keyMap
    diyValueMap = valueMap
    const result: any = []
    // TODO 返回一个对象，更加灵活，考虑什么样的结构
    const changeStructure = analysisChange(history, [], signKey, originalObj)
    for (let i = 0; i < changeStructure.length; i += 1) {
        const { originalObj: changeOriginalObj } = changeStructure[i]
        const changeDescribe = describeChange([changeStructure[i]])
        const { beforeModified, afterModified } = describeWholeObj(changeOriginalObj)
        result.push({
            changeDescribe,
            beforeModified,
            afterModified
        })
    }
    return result
}

