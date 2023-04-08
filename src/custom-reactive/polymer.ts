import { cloneDeep } from 'lodash-es'
import { CHANGETYPE, CHANGE } from './constant'
export function polymer(diff: Array<any>) {
    let result = {}
    for(let i = 0; i < diff.length; i += 1) {
        const { type, value } = diff[i]
        for (const [path, change] of Object.entries(value)) {
            result = joinPath(result, path, { [CHANGETYPE]: type, [CHANGE]: change })
        }
    }
    return result
} 

function joinPath(obj: object, path: string, option: any) {
    const singlePathArr = path.split('.')
    const result: any = cloneDeep(obj)
    let cloneObj = result
    for(let i = 0; i < singlePathArr.length; i += 1) {
        const singlePath = singlePathArr[i]
        if (!(singlePath in cloneObj)) {
            cloneObj[singlePath] = {}
        }
        cloneObj = cloneObj[singlePath]
    }
    cloneObj = Object.assign(cloneObj, option)
    return result
}