import { BASICDATAKEY } from "./constant";
import type { CompareResult } from "./type";
import { isObject, isSomeType } from "./utils";
/**
 *  数据变化是为了描述谁的？
 *  { name: '', age: '' } 
 *    新增一条这个数据：新增**用户名**为name的数据 ===> name是关键字段
 *     
 *  [{ key: '', value: [{name: '', checked: true }] }]修改这样的数据： 修改设备归属，个人设备的xxx => xxx
 *   ===> 根据修改变量路径形成修改记录 value.0.name  沿着这条线去找key，这条线的最后一个才需要转义
 *  如果是基本数据类型，那它不描述任何东西，它的描述需要其他参数来补充
 */

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


function compareObjects(obj1: any, obj2: any, signKey?: string): any {
  let result: any = {};
  // Find added and updated properties
  // 如果是数组的话不要这样遍历
  const existIn = (obj2: any, obj2Item: any, key: string, obj1: any) => {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return obj1.findIndex(item => deepEqual(item, obj2Item)) !== -1
    } else {
      return obj1.hasOwnProperty(key)
    }
  }
  const findObjItem = (obj2: any, obj2Item: any, key: string, obj1: any) => {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return obj1.find(item => deepEqual(item, obj2Item))
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
        const nestedDiff = compareObjects(value1, value2, signKey);
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
    // boolean 怎么处理
    if (!existIn(obj1, obj1[key], key, obj2)) {
      result[key] = null;
    }
  }
  return result;
}

function compareArrays(arr1: any[], arr2: any[], signKey?: string): any[] {
  const result: Array<CompareResult> = [];

  // Look for deletions
  for (let i = 0; i < arr1.length; i++) {
    const found = arr2.find(item => deepEqual(item, arr1[i]));
    if (!found) {
      result.push({ type: "deleted", value: arr1[i] });
    }
  }
  // Look for additions
  for (let i = 0; i < arr2.length; i++) {
    const found = arr1.find(item => deepEqual(item, arr2[i]));
    if (!found) {
      result.push({ type: "added", value: arr2[i] });
    }
  }

  // Look for modifications
  for (let i = 0; i < arr1.length; i++) {
    const found = arr2.find(item => deepEqual(item, arr1[i]));
    if (found && typeof arr1[i] === "object" && typeof found === "object") {
      const diff = compareObjects(arr1[i], found, signKey);
      if (Object.keys(diff).length > 0) {
        const res = getObjectDiff(diff, arr1[i], i.toString())
        //TODO 在记录的时候，属性变化，需要对变化做出描述，自动向平级/上级找关键字处理
        // 判断value的层级， 自动的过程
        result.push(...res.map(item => ({ ...item })));
      }
    }
  }
  return result;
}

function deepEqual(obj1: any, obj2: any): boolean {
  // 只需要判断他们的key是否
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    return obj1 === obj2;
  }

  if (Object(obj1).hasOwnProperty('key') && Object(obj2).hasOwnProperty('key')) {
    return obj1.key === obj2.key
  }
  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }

  for (let key in obj1) {
    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}

export const compare = (oldValue: any, newValue: any, signKey?: string): Array<CompareResult> => {
  let result: Array<CompareResult> = []
  if (newValue === oldValue) {
    // 没有变化，对于对象还需要处理
  } else {
    if (isSomeType(oldValue, newValue)) {
      // 嵌套对象的处理
      if (isObject(newValue)) {
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
          result = compareArrays(oldValue, newValue, signKey)
          // 给一个signKey, signKey相同的对象为描述同一个日志
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
  return result
}