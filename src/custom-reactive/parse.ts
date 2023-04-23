import { isObject, parseObjectKey, parseObjectValue } from "./utils"

const parse = (obj: any, keyMap: Array<any>, valueMap: Array<any>, path: Array<string> = []) => {
    const parsedObj: any = Array.isArray(obj) ? new Array() : {}
    for(const [ key, value ] of Object.entries(obj)) {
        const fullPath = [...path, key]
        let parsedKey = parseObjectKey(fullPath, keyMap)
        parsedKey = parsedKey === fullPath.join('.') ? key : parsedKey
        if (isObject(value)) {
            parsedObj[parsedKey] = parse(value, keyMap, valueMap, fullPath)
        } else {
            const parsedValue = parseObjectValue(fullPath, value, valueMap)
            parsedObj[parsedKey] = parsedValue
        }
    }
    return parsedObj
}

export {
    parse
}