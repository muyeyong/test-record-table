import type { Ref } from "vue"
export interface Option {
    describe?: string
    signKey?: string[]
    parent?: string
    type?: string
    keyMap?: object
    valueMap?: object
    individual?: boolean
    refreshRecord?: boolean
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