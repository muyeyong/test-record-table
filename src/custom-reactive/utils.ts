
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


export function isArrayObject(obj: any) {
  for (const value of Object.values(obj)) {
    if (!isObject(value)) return false
  }
  return isObject(obj)
}

export function translateArrayLike(obj: any) {
  const result = []
  if (isArrayObject(obj)) {
    for (const value of Object.values(obj)) {
      result.push(value)
    }
    return result
  }
  return obj
}