import { cloneDeep, keyBy } from "lodash-es";
import { CHANGETYPE, CHANGE, WRAPVALUEKEY } from "./constant";
import effectChange from "./effectChange";
import { isValidKey } from "./utils";
export function polymer(diff: Array<any>) {
  //TODO 同一个新增 删除处理
  let result = {};
  for (let i = 0; i < diff.length; i += 1) {
    const { type, value } = diff[i];
    for (const [path, change] of Object.entries(value)) {
      result = joinPath(result, path, { [CHANGETYPE]: type, [CHANGE]: change });
    }
  }
  return result;
}

function parseNewValue(str: string, originObj: object) {
  let parsedStr = str;
  const regex = /{{\s*([\w.]+)\s*}}/g;
  const matches = str.match(regex) || [];
  for (const match of matches) {
    const regex = /{{\s*(.*?)\s*}}/;
    const match1 = regex.exec(match);
    const pathArr = match1![1].split(".");
    let tempObj = originObj;
    let i = 0;
    for (; i < pathArr.length; ) {
      const key = pathArr[i];
      if (isValidKey(WRAPVALUEKEY, tempObj)) {
        tempObj = tempObj[WRAPVALUEKEY];
        continue;
      }
      if (isValidKey(key, tempObj)) {
        tempObj = tempObj[key];
      } else {
        break
      }
      i += 1;
    }
    if (i === pathArr.length) {
      parsedStr = parsedStr.replace(match, tempObj as any);
    }
  }
  return parsedStr;
}

function updateDiff(diff: any, path: string, oldValue: any, newValue: any) {
  const pathArr = path.split(".");
  let i = 0;
  let tempDiff = diff;
  for (; i < pathArr.length; ) {
    const key = pathArr[i];
    if (isValidKey(WRAPVALUEKEY, tempDiff)) {
      tempDiff = tempDiff[WRAPVALUEKEY];
      continue;
    }
    if (isValidKey(key, tempDiff)) {
      tempDiff = tempDiff[key];
    }
    i += 1;
  }
  if (i === pathArr.length) {
    if (isValidKey(CHANGE, tempDiff) && isValidKey(CHANGETYPE, tempDiff)) {
        if (Array.isArray(tempDiff[CHANGE])) {
            for (let i = 0; i < tempDiff[CHANGE].length; i += 1) {
                if (tempDiff[CHANGE][i] === oldValue) {
                    tempDiff[CHANGE][i] = newValue
                }
            }
        } else {
            if (tempDiff[CHANGE] === oldValue)
                tempDiff[CHANGE] = newValue;
        }
    }
  }
}

function updateDiffByEffect(diff: any, path: string, effect: any, template: string, effectPath: string) {
    let tempDiff = diff
    const effectValue = effect[CHANGE]
    const effectType = effect[CHANGETYPE]
    const pathArr = path.split('.')
    const lastKey = pathArr.pop() || ""
    let i = 0
    for(;i < pathArr.length; ) {
      const key = pathArr[i]
       if (isValidKey(WRAPVALUEKEY, tempDiff)) {
          tempDiff = tempDiff[WRAPVALUEKEY]
          continue
       }
       if (!isValidKey(key, tempDiff)) {
          tempDiff[key] = {}
       } 
       i += 1
       tempDiff = tempDiff[key]
    }
   const handleTemplate = (value: any) => template.replace(/{{\s*([^{}\s]*)\s*}}/g, (match, p1) => {
     if (p1 === effectPath)
        return value
    })
    if (effectType === 'modified') {
      const [ oldValue, newValue ] = effectValue
      const beforeValue = handleTemplate(oldValue)
      const afterValue = handleTemplate(newValue)
      tempDiff[lastKey] = { [CHANGE]: [beforeValue, afterValue], [CHANGETYPE]: 'modified' }
    } else {
      const newValue = effectValue
      const afterValue = handleTemplate(newValue)
      tempDiff[lastKey] = { [CHANGE]: ['', afterValue], [CHANGETYPE]: 'modified' }
    }
}

export function collectEffect(configs: Array<Record<string, Array<any>>>,) {
  const regex = /{{\s*(.*?)\s*}}/gm;
  let match;
  for (const config of configs) {
    const [old, newValue] = Object.values(config)[0];
    while ((match = regex.exec(newValue))) {
        effectChange.addEffect(match[1], config)
      }
  }
}

export function handleValueMapConfig(
  diff: object,
  configs: Array<Record<string, Array<any>>>,
  obj: any
) {
  for (const config of configs) {
    const path = Object.keys(config)[0];
    const [oldValue, newValue] = Object.values(config)[0];
    //  resource.flow 需要收集，如果改动这个值
    // 解析newValue里面的路径，到obj里面查找最新的值 最大流量{{ resource.flow }} kb/S
    const parsedStr = parseNewValue(newValue, obj);
    // 根据path oldValue 寻找diff
    // console.log(diff, path, oldValue)
    updateDiff(diff, path, oldValue, parsedStr);
  }
}


const existEffect = (effectPath: string, diff: any) => {
    const pathArr = effectPath.split('.')
    let i = 0
    let tempDiff = diff
    for (;i < pathArr.length;) {
        const key = pathArr[i]
        if (isValidKey(WRAPVALUEKEY, tempDiff)) {
            tempDiff = tempDiff[WRAPVALUEKEY]
            continue
        }
        if (isValidKey(key, tempDiff)) {
            tempDiff = tempDiff[key]
        } else {
          break
        }
         i += 1
    }
    if (i === pathArr.length) return tempDiff
    return null
}
export function addEffectChange(diff: any) {
    const effects = effectChange.getEffect()
    for(const [effectPath, effectArr] of effects.entries()) {
        let currEffect
        if ((currEffect = existEffect(effectPath, diff))) {
           for(const effect of effectArr)  {
            const path = Object.keys(effect)[0]
            const template = Object.values(effect)[0][1]
            if (!existEffect(path, diff)) {
                updateDiffByEffect(diff, path, currEffect, template, effectPath)
            }
           }
        }
    }
}

function joinPath(obj: object, path: string, option: any) {
  const singlePathArr = path.split(".");
  const result: any = cloneDeep(obj);
  let cloneObj = result;
  for (let i = 0; i < singlePathArr.length; i += 1) {
    const singlePath = singlePathArr[i];
    if (!(singlePath in cloneObj)) {
      cloneObj[singlePath] = {};
    }
    cloneObj = cloneObj[singlePath];
  }
  cloneObj = Object.assign(cloneObj, option);
  return result;
}
