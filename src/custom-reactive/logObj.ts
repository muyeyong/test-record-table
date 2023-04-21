import { customRef, reactive, toRefs, ref } from "vue";
import { addSignKey } from "./utils";

export default function createCustomRef(initValue: any) {
    const reactiveData = reactive({ value: initValue });
    return customRef((track, trigger) => ({
        get() {
            track();
            reactiveData.value = addSignKey(reactiveData.value)
            return reactiveData.value;
        },
        set(newValue: any) {
            if (JSON.stringify(newValue) === JSON.stringify(reactiveData.value)) {
                return;
            }
            reactiveData.value = newValue;
            trigger();
        },
    }));
}
