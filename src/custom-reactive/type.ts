import type { Ref } from "vue"

export interface Option {
    describe: string
    signKey?: string
    parent?: string
    type?: string
    keyMap?: object
    valueMap?: object
    individual?: boolean
}

/**
 * 
 * @param oldValue 
 * @param newValue 
 * {
 *  modify: { modifyKey: [old, new ] }
 *  delete: { deleteKey: deleteValue  }
 *  add: { addKey: [...addValue ] }
 * }
 */
export interface CompareResult {
    type: 'modified' | 'added' | 'deleted'
    key?: any
    value: any
    originalObj?: any
}
export interface ReactiveObjHistory<T> extends Option {
    value: Array<T>
}

export type ReactiveObjHistoryMap<T> = Map<Ref | string, ReactiveObjHistory<T>>
export type ComponentHistoryMap<T> = ReactiveObjHistoryMap<T> | Map<string, ChildHistoryMap<T>>
export type ChildHistoryMap<T> = Map<number, ComponentHistoryMap<T>>