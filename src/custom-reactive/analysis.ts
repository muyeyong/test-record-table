import selfKeyMap from './keyMap.json'
import selfValueMap from './valueMap.json'
import {deletePropertiesFrom, isEmptyObj, isObject, parseObjectKey, parseObjectValue } from "./utils"
import { CHANGE, CHANGETYPE, INGOREKEY, NOPARSED, SIGNKEY } from "./constant"
import { cloneDeep } from 'lodash-es'

let diyKeyMap: object | null | undefined | Function = null
let diyValueMap: object | null | undefined | Function = null

const findSignKeyValue = (obj: any, signKey: string[]) => {
    let objSignKey = ""
    for (let i = 0; i <= signKey.length; i += 1) {
        const key = signKey[i]
        if (obj[key] !== undefined) {
            objSignKey = key
            break
        }
    }
    if (objSignKey === "") {
        return ""
    } else {
        const path = ["signKey", objSignKey]
        const parsedValue = parseObjectValue(path, obj[objSignKey], [diyValueMap])
        if (parsedValue !== undefined && !isObject(parsedValue)) {
            return parsedValue
        } else if (!isObject(obj[objSignKey])) {
            return obj[objSignKey]
        } else {
            return ""
        }
    }
}

const analysisChange = (changes: object, path: Array<string>, signKey: string[], originalObj: any) => {
    let result: Array<any> = []
    for (const [changeKey, changeValue] of Object.entries(changes)) {
        if (CHANGE in changeValue && CHANGETYPE in changeValue) {
            const { newObj = {}, oldObj = {} } = originalObj
            const fullPath = ([] as string[]).concat(path, changeKey)
            const type = changeValue[CHANGETYPE]
            const change = changeValue[CHANGE]
            const parsedKey = parseObjectKey(fullPath, [diyKeyMap, selfKeyMap])
            if (parsedKey === INGOREKEY || parsedKey === SIGNKEY ) continue
            const parsedValue = parseObjectValue(fullPath, change, [diyValueMap, selfValueMap])
            const targetObj = type === 'deleted' ? oldObj : newObj
            const changeWholeObj = isObject(targetObj[changeKey]) ? true : false
            if (changeWholeObj) {
                // 删除 or 数组移动
                let describeWholeKey = findSignKeyValue(targetObj[changeKey], signKey)
                if (type === 'deleted') {
                    let describeWholeObj: any = {}
                    for (const [key, value] of Object.entries(targetObj[changeKey])) {
                        const currPath = [...fullPath, key]
                        const k1 = parseObjectKey(currPath, [diyKeyMap, selfKeyMap]) as string
                        if (k1 === INGOREKEY) continue
                        const v1 = parseObjectValue(currPath, value, [diyValueMap, selfValueMap])
                        describeWholeObj[k1] = v1
                    }
                    result.push({ type, key: describeWholeKey, value: describeWholeObj, originalObj: { oldObj: oldObj[changeKey], newObj: newObj[changeKey] } })
                } else if(type === 'indexModified'){
                    result.push({ type, key: describeWholeKey, value: parsedValue, originalObj: { oldObj: oldObj[changeKey], newObj: newObj[changeKey] } })
                }
            } else {
                result.push({ type, key: parsedKey, value: parsedValue, originalObj: { oldObj: parseObjectValue(fullPath, oldObj[changeKey], [diyValueMap, selfValueMap]), newObj: parseObjectValue(fullPath, newObj[changeKey], [diyValueMap, selfValueMap]) } })
            }
        } 
        const newChangeValue = deletePropertiesFrom(changeValue, [CHANGE, CHANGETYPE])
        if (isEmptyObj(newChangeValue)) continue
        const { newObj, oldObj } = originalObj
        const nextNewObj = newObj[changeKey]
        const nextOldObj = oldObj[changeKey]
        const selfValue = nextNewObj ? nextNewObj : nextOldObj
        const signKeyValue = findSignKeyValue(selfValue, signKey)
        const selfKey = signKeyValue === "" ? NOPARSED : signKeyValue
        let target = result.find(item => {
            return item.key === selfKey
        })
        if (!target) {
            target = { key: selfKey, originalObj: { oldObj: { [changeKey]: cloneDeep(nextOldObj) }, newObj: { [changeKey]: cloneDeep(nextNewObj) } }, children: [] }
            result.push(target)
        }
        target.children = [].concat(target.children || [], ...analysisChange(changeValue, ([] as string[]).concat(path, changeKey), signKey, { newObj: nextNewObj, oldObj: nextOldObj }))
    }
    return result
}

interface AnalysisResultItem {
    key: string,
    children: AnalysisResultItem[]
    originalObj: {
        newObj: object
        oldObj: object
    }
    type?: 'added' | 'deleted' | 'modified'
    value?: string | string[]
}
const simplifyAnalysisResult = (result: AnalysisResultItem[], parentResult:AnalysisResultItem[], parentKey? : string) => {
    const newResult: AnalysisResultItem[] = []
    for(const node of result) {
        const { key, children, type, value } = node
        const newNode:Partial<AnalysisResultItem> = { key, type, value }
        if (newNode.type === undefined) delete newNode.type
        if (newNode.value === undefined) delete newNode.value
        if (key === NOPARSED) {
            if (children && children.length > 0) {
                if (parentKey) {
                    newNode.children = simplifyAnalysisResult(children, parentResult)
                } else {
                  newResult.push(...simplifyAnalysisResult(children, parentResult)) 
                }
            }
        }
        if(!parentKey) {
            if (key !== NOPARSED)
            newResult.push(newNode as AnalysisResultItem)
        } else {
            const parentNode = parentResult.find(node => node.key === parentKey);
            if (!parentNode) {
              throw new Error(`Parent node with key ${parentKey} not found!`);
            }
            if (!parentNode.children) {
              parentNode.children = [];
            }
            if (newNode.key === NOPARSED) {
                parentNode.children.push(...(newNode.children??[]))
            } else {
                parentNode.children.push(newNode as AnalysisResultItem);
            }
        }
        if (children && Array.isArray(children) && key !== NOPARSED) {
            simplifyAnalysisResult(children, newResult, key).forEach((child: any) => {
                if (!newNode.children) {
                    newNode.children = []
                }
                newNode.children.push(child)
            })
        }
    }
    return newResult
}

const generateObjDescribe = (obj: any, parentPath: Array<string>): Array<any> => {
    let result = []
    const describeMap = new Map()
    let describeObj: any = {}
    let path: string[] = [...parentPath]
    for (const key in obj) {
        let childrenResult = []
        if (isObject(obj[key])) {
            path.push(key)
            childrenResult = generateObjDescribe(obj[key], path)
            path.pop()
        } else {
            const fullPath = [...path, key]
            const parsedKey = parseObjectKey(fullPath, [diyKeyMap, selfKeyMap])
            if (parsedKey === INGOREKEY) continue
            const parsedValue = parseObjectValue(fullPath, obj[key], [diyValueMap, selfKeyMap]) || '空'
            let target = describeMap.get(parsedKey)
            if (target) {
                target.add(parsedValue)
            } else {
                target = new Set()
                target.add(parsedValue)
                describeMap.set(parsedKey, target)
            }
        }
        childrenResult.forEach(item => {
            for (const [childKey, childValue] of Object.entries(item)) {
                let target = describeMap.get(childKey)
                if (target) {
                    target.add(childValue)
                } else {
                    target = new Set()
                    target.add(childValue)
                    describeMap.set(childKey, target)
                }
            }
        })
    }
    if (describeMap.size > 0) {
        for (const [key, value] of describeMap.entries()) {
            describeObj[key] = Array.from(value).join('、')
        }
        result.push(describeObj)
    }
    return result
}

const describeWholeObj = (originalObj: any) => {
    let beforeModified: Array<any> = []
    let afterModified: Array<any> = []
    const { newObj, oldObj } = originalObj
    if (isObject(newObj)) {
        afterModified = generateObjDescribe(newObj, [])
    } else {
        afterModified = [{ BASICDATAKEY: newObj }]
    }

    if (isObject(oldObj)) {
        beforeModified = generateObjDescribe(oldObj, [])
    } else {
        beforeModified = [{ BASICDATAKEY: oldObj }]
    }
    return { beforeModified, afterModified }
}

const parsedDescribeValue = (value: any) => {
    if (isObject(value)) {
        let res = ""
        for(const [itemKey, itemValue] of Object.entries(value)) {
            res += `${itemKey}:${parsedDescribeValue(itemValue)},`
        }
        return res
    }
    return value
}
const describeChange = (changes: Array<AnalysisResultItem>) => {
    // TODO 对于重复的key没有处理
    let describeStr = ""
    for (const change of changes) {
        const { key, children, type, value } = change
        if (type) {
            if (type === 'added') {
                describeStr +=`${key}:新增:${parsedDescribeValue(value)},`
            } else if (type === 'deleted') {
                describeStr +=`${key}:删除:${parsedDescribeValue(value)},`
            }else if (type === 'modified') {
                if (value) {
                    const [oldValue, newValue] = value
                    describeStr +=`${key}:修改:从${parsedDescribeValue(oldValue)}修改成${parsedDescribeValue(newValue)},`
                }
            } else if (type === 'indexModified') {
                if(value) {
                    const [oldIndex, newIndex] = value
                    describeStr += `${key}:位置从${oldIndex}变动到${newIndex}`
                }
                
            }
        } else {
            describeStr += `${key}\n`
        }
        if (children) {
           describeStr += describeChange(children)
        }
    }
    return describeStr
}

export const analysis = (history: any, originalObj: any, signKey: string[], keyMap?: object, valueMap?: object) => {
    diyKeyMap = keyMap
    diyValueMap = valueMap
    const result: any = []
    // TODO 返回一个对象，更加灵活，考虑什么样的结构
    const changeStructure = analysisChange(history, [], signKey, originalObj)
    for (let i = 0; i < changeStructure.length; i += 1) {
        const { originalObj: changeOriginalObj } = changeStructure[i]
        const changeDescribe = describeChange(simplifyAnalysisResult([changeStructure[i]], []))
        //TODO 对于indexModified的变动，是否输出全部的值
        const { beforeModified, afterModified } = describeWholeObj(changeOriginalObj)
        result.push({
            changeDescribe,
            beforeModified,
            afterModified
        })
    }
    return result
}



