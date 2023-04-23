import { isEqual } from "lodash-es"

class EffectChange {
    private effect = new Map()
    addEffect(str: string, diyMap: any) {
        let target = this.effect.get(str)
        if (!target) {
            target = new Array()
            this.effect.set(str, target)
        }
        if (!target.find((item: any) => isEqual(item, diyMap))) {
            target.push(diyMap)
        }
        
    }
    getEffect() {
        return this.effect
    }
}

const effectChange = new EffectChange()
export default effectChange