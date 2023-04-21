import { cloneDeep, isNumber } from "lodash-es"
import { CHILDHISTORYFLAG, PARSEWILDCARD, ROOTDESCRIBE, SIGNKEY, WRAPVALUEKEY } from "./constant"
import type { ChildHistoryMap, ComponentHistoryMap, SignKeyExpend } from "./type"

export const isValidKey = (key: string | number | symbol, object: object): key is keyof typeof object => {
  try {
    return key in object
  } catch (error) {
    return false
  }
}
export const isObject = (val: any) => typeof val === 'object' && val !== null
export const isSomeType = (val1: any, val2: any) => {
  if (isObject(val1) && isObject(val2)) {
    return true
  } else if (!isObject(val1) && !isObject(val2)) {
    return typeof val1 === typeof val2
  }
  return false
}

export const isEmptyObj = (obj: any) => {
  if (!isObject(obj)) return false
  for (const key in obj) {
    return false
  }
  return true
}
export function filter(map: Map<any, any>, pred: (k: any, v: any) => boolean) {
  const result = new Map();
  for (let [k, v] of map) {
    if (pred(k, v)) {
      result.set(k, v);
    }
  }
  return result;
}

export function parseObjectKey(fullPath: Array<string>, keyMap: Array<any>, hierarchy = 4) {
  for (let i = 0; i < keyMap.length; i += 1) {
    const result = keyMap[i]['__diy']? keyMap[i]['__diy'] : keyMap[i]
    if (!result) continue
    const normalFind = (path: Array<string>) => {
      let j = 0
      let keyMap = cloneDeep(result)
      for (j = 0; j < path.length; j++) {
        const key = path[j]
        if (key === WRAPVALUEKEY) continue
        if (isValidKey(key, keyMap)) {
          keyMap = keyMap[key]
        } else if (isValidKey(PARSEWILDCARD, keyMap)) {
          keyMap = keyMap[PARSEWILDCARD]
        } else {
          break
        }
      }
      if (j === path.length) {
        return isObject(keyMap) ? "" : keyMap
      }
      return ""
    }

    const keys = []
    for(let i = 1; i <= fullPath.length; i += 1) {
      const key = fullPath[fullPath.length - i]
      if (Number.isInteger(Number(key)) || key === undefined) {
        continue
      }
      keys.unshift(key)
      const res = normalFind(keys)
      if (res !== "") return res
    }
  }
  return fullPath.join('.')
}

export function parseObjectValue(fullPath: Array<string>, value: any, valueMap: Array<any>, hierarchy = 4) {
  const parseSingleValue = (path: Array<string>, value: any) => {
    const parse = (keyArr: string[], value: any) => {
      for (let i = 0; i < valueMap.length; i += 1) {
        let result = valueMap[i]['__diy']? valueMap[i]['__diy'] : valueMap[i]
        if (!result) continue
        let j = 0
        for (j = 0; j < keyArr.length; j++) {
          const key = keyArr[j]
          if (key === WRAPVALUEKEY) continue
          if (isValidKey(key, result)) {
            result = result[key]
          } else if (isValidKey(PARSEWILDCARD, result)) {
            result = result[PARSEWILDCARD]
          } else {
            break
          }
        }
        if (j === keyArr.length && !isObject(result[value])) return result[value]
      }
      return ""
    }
    const keys: string[] = []
    for(let i = 1; i <= path.length; i += 1) {
      const key = path[path.length - i]
      if(Number.isInteger(Number(key)) || key === undefined) {
        continue
      }
      keys.unshift(key)
      const res = parse(keys, value)
      if (res !== "") return res
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

export const isNestObj = (obj: any) => {
  if (!isObject(obj)) return false
  for (const key in obj) {
    if (!isObject(obj[key])) return false
  }
  return true
}

const refreshChildHistory = <T = any>(history: ChildHistoryMap<T>) => {
  for (let historyValue of history.values()) {
    refreshHistory(historyValue)
  }
}

export const refreshHistory = <T = any>(history: ComponentHistoryMap<T>) => {
  const subComponentHistory = history.get(CHILDHISTORYFLAG)
  const selfHistory = filter(history, (k, v) => k !== CHILDHISTORYFLAG)
  if (selfHistory) {
    for (const [key, value] of selfHistory.entries()) {
      if (key === ROOTDESCRIBE) continue
      const latestValue = value.value[value.value.length - 1]
      value.value = [latestValue]
    }
  }
  if (subComponentHistory) {
    refreshChildHistory(subComponentHistory as ChildHistoryMap<T>)
  }
}

export const addSignKey = (obj:any) => {
  for(let key in obj) {
      let value: SignKeyExpend = obj[key]
      if (isObject(value)) {
        if (value[SIGNKEY] === undefined && !Array.isArray(value)) {
          value[SIGNKEY] = Symbol()
        }
        obj[key] = addSignKey(obj[key])
      }
  }
  return obj
}

export const deletePropertiesFrom = (obj: object, properties: any[]) => {
  const newObj = cloneDeep(obj)
  for (const property of properties) {
    if (isValidKey(property, newObj)) {
      delete newObj[property]
    }
  }
  return newObj
}