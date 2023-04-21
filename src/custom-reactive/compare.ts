import { BASICDATAKEY, SIGNKEY } from "./constant";
import type { CompareResult } from "./type";
import { isObject, isSomeType, isValidKey } from "./utils";

let currSignKey: string[] = []

function getObjectDiff(diff: any, originalObj: any = {}, path: string = "") {
  let result: Array<CompareResult> = []
  for (let key in diff) {
    const fullPath = path ? `${path}.${key}` : key;
    const value = diff[key];
    const originalValue = originalObj[key];
    if (value === null || value === "") {
      result.push({ type: 'deleted', value: { [fullPath]: originalValue } })
    } else if (typeof value === "object") {
      result.push(...getObjectDiff(value, originalValue, fullPath))
    } else {
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        result.push({ type: 'added', value: { [fullPath]: value } })
      } else {
        result.push({ type: 'modified', value: { [fullPath]: [originalValue, value] } })
      }
    }
  }
  return result
}


function compareObjects(obj1: any, obj2: any): any {
  let result: any = {};
  // Find added and updated properties
  // 如果是数组的话不要这样遍历
  const existIn = (obj2: any, obj2Item: any, key: string, obj1: any) => {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return obj1.findIndex(item => shallowEqual(item, obj2Item)) !== -1
    } else {
      return obj1.hasOwnProperty(key)
    }
  }
  const findObjItem = (obj2: any, obj2Item: any, key: string, obj1: any) => {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return obj1.find(item => shallowEqual(item, obj2Item))
    } else {
      return obj1[key]
    }
  }
  for (let key in obj2) {
    // object
    const isExist = existIn(obj2, obj2[key], key, obj1)
    // boolean 怎么处理
    if (isExist) {
      const value1 = findObjItem(obj2, obj2[key], key, obj1)
      const value2 = obj2[key];
      if (typeof value1 === "object" && typeof value2 === "object") {
        const nestedDiff = compareObjects(value1, value2);
        if (Object.keys(nestedDiff).length > 0) {
          result[key] = nestedDiff;
        }
      } else if (value1 !== value2) {
        result[key] = value2;
      }
    } else {
      result[key] = obj2[key];
    }
  }

  // Find deleted properties
  for (let key in obj1) {
    if (!existIn(obj1, obj1[key], key, obj2)) {
      result[key] = null;
    }
  }
  return result;
}

const wrapperArrayItem = (item: any, path: string) => {
  let result: any = {}
 Object.entries(item).forEach(entry => {
    const [key, value] = entry
    result[`${path}.${key}`] = value 
    // if (Array.isArray(value)) {
    //   //TODO 这里要测试
    //   for(let i = 0; i < value.length; i += 1) {
    //      result[`${path}.${key}`]  = wrapperArrayItem(value[i], `${path}.${key}.${i}`)
    //   }
    // } else {
    //   result[`${path}.${key}`] = value 
    // }
  })
  return result
}
function compareArrays(oldArr: any[], newArr: any[]): any[] {
  const result: Array<CompareResult> = [];
  // Look for deletions
  for (let i = 0; i < oldArr.length; i++) {
    const found = newArr.find(item => shallowEqual(item, oldArr[i]));
    if (!found) {
      result.push({ type: "deleted", value: wrapperArrayItem(oldArr[i], i.toString()) });
    }
  }
  // Look for additions
  for (let i = 0; i < newArr.length; i++) {
    const found = oldArr.find(item => shallowEqual(item, newArr[i]));
    if (!found) {
      result.push({ type: "added", value: wrapperArrayItem(newArr[i], i.toString()) });
    }
  }

  // Look for modifications
  for (let i = 0; i < oldArr.length; i++) {
    const index = newArr.findIndex(item => shallowEqual(item, oldArr[i]));
    const found = newArr[index]
    if (found && typeof oldArr[i] === "object" && typeof found === "object") {
      const diff = compareObjects(oldArr[i], found);
      if (Object.keys(diff).length > 0) {
        const res = getObjectDiff(diff, oldArr[i], index.toString())
        result.push(...res);
      } 
      if (index !== i) {
        // 变动了位置
        result.push({ type: 'indexModified', value: { [index]: [i, index] }})
      }
    }
  }
  return result;
}

function shallowEqual(obj1: any, obj2: any): boolean {
  // 只需要判断他们的key是否
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    return obj1 === obj2;
  }

  if (isValidKey(SIGNKEY, obj1) && isValidKey(SIGNKEY, obj2)) {
    return obj1[SIGNKEY] === obj2[SIGNKEY]
  }

  for(let i = 0; i < currSignKey.length; i += 1) {
    const key = currSignKey[i]
    if(isValidKey(key, obj1) && isValidKey(key, obj2)) {
      return obj1[key] === obj2[key]
    }
  }
  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }

  for (let key in obj1) {
    if (isObject(obj1[key]) && isObject(obj2[key])) {
      continue
    } else if (!isObject(obj1[key]) && !isObject(obj2[key])) {
      const res = shallowEqual(obj1[key], obj2[key])
      if (!res) return res
    } else {
      return false
    }
  }
  return true;
}

export const compare = (oldValue: any, newValue: any,signKey: string[]): Array<CompareResult> => {
  let result: Array<CompareResult> = []
  currSignKey = signKey
  if (newValue === oldValue) {
    // 没有变化，对于对象还需要处理
  } else {
    if (isSomeType(oldValue, newValue)) {
      // 嵌套对象的处理
      if (isObject(newValue)) {
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          result = compareArrays(oldValue, newValue)
        } else {
          result = getObjectDiff(compareObjects(oldValue, newValue), oldValue)
        }
      } else {
        // 基本数据类型处理, key全部是base
        const isEmptyBasicValue = (value: any) => value === null || value === '' || value === undefined
        if (isEmptyBasicValue(oldValue)) {
          // 增加: oldValue为null undefined ''
          result.push({ type: 'added', value: { [BASICDATAKEY]: newValue } })
        } else if (isEmptyBasicValue(newValue)) {
          // 删除 newValue为null undefined ''
          result.push({ type: 'deleted', value: { [BASICDATAKEY]: oldValue } })
        } else {
          // 修改
          result.push({ type: 'modified', value: { [BASICDATAKEY]: [oldValue, newValue] } })
        }
      }
    } else {
      // 不同类型，不能比较
    }
  }
  console.log(result)
  return result
}