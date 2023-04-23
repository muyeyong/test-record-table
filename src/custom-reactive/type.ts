import type { Ref } from "vue"

export interface DiyMap {
    isDiyMap: boolean
    baseMap: object
    rules: Array<Record<string, any>>
}
export interface Option {
    describe?: string
    signKey?: string[]
    parent?: string
    type?: string
    keyMap?: object | DiyMap
    valueMap?: object | DiyMap
    individual?: boolean
    refreshRecord?: boolean
    valueMapConfig?: Array<Record<string, Array<any>>>
}

export interface CompareResult {
    type: 'modified' | 'added' | 'deleted' | 'indexModified'
    key?: any
    value: any
    originalObj?: any
}
export interface ReactiveObjHistory<T> extends Option {
    value: Array<T>
}

export interface SignKeyExpend {
    [key: string]: any,
    __SIGNKEY?: symbol
}

export type ReactiveObjHistoryMap<T> = Map<Ref | string, ReactiveObjHistory<T>>
export type ComponentHistoryMap<T> = ReactiveObjHistoryMap<T> | Map<string, ChildHistoryMap<T>>
export type ChildHistoryMap<T> = Map<number, ComponentHistoryMap<T>>