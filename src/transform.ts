/**
 * 将parser解析的结果做二次处理
 */

import { INode, LimboAttr, ParserAttr } from "./interface"

const forBodyPat = /(?<key>.*) in (?<data>.*)/
const parenthesisPat = /[\(|\)]/

type Condition = {
    descriminat: string,
    comp: INode | Merge
}

type Merge = ForMerge | IfMerge

enum MergeType {
    ForMerge = 1,
    IfMerge
}
type ForMerge = {
    type: MergeType.ForMerge,
    forBody?: string,
    forVal?: string,
    forIdx?: string,
    comp?: INode,
    idx?: number
}

type IfMergeBody = {
    idx: number,
    cond: Condition
}

type IfMerge = {
    type: MergeType.IfMerge,
    if ?: IfMergeBody,
    elif?: IfMergeBody[],
    else?: IfMergeBody,
    endIdx ?: number
}

type LimboIfMerge = {
    type: MergeType.IfMerge,
    if ?: Condition,
    elif ?: Condition[],
    else ?: Condition
}

const transformIfMerge2LimboIfMerge = (ifMerge: IfMerge): LimboIfMerge => {
    const handled = ['if', 'elif', 'else']
    const LimboIfMerge: LimboIfMerge = {type: MergeType.IfMerge}
    handled.forEach((key) => {
        if(ifMerge[key]) {
           if(key !== 'elif') LimboIfMerge[key] = ifMerge[key].cond
           else LimboIfMerge[key] = ifMerge[key].map((cond) => cond.cond)
        }
    })

    return LimboIfMerge
}

const compileCondChildren = (Merges: Merge[], _children: (INode | Merge)[]) => {
    let handleChildIdx = 0,
        handledChildren: (INode | LimboIfMerge)[] = []
    
    const children = [..._children]

    // merge for
    for(let i = 0; i < Merges.length; i++) { 
        const merge = Merges[i]

        if(merge.type === MergeType.ForMerge) {
            const { idx } = merge
            const limboForMerge = {...merge}
            delete limboForMerge.idx
            children[idx] = limboForMerge
        }
    }

    // merge if
    for(let i = 0; i < Merges.length; i++) {
        const merge = Merges[i]

        if(merge.type === MergeType.IfMerge) {
            const { endIdx, if: ifCond } = merge
            if(!ifCond || endIdx === undefined) continue

            const startIdx = ifCond.idx
            for(let i = handleChildIdx; i < children.length; i++) {
                if(i >= startIdx) {
                    // reserve forMerge
                    Object.entries(merge).forEach(([key, val]: [string, any]) => {
                        if(key === 'if' || key === 'else') val.comp = children[val.idx]
                        else if(key === 'elif') val.forEach((cond: IfMergeBody) => cond.cond.comp = children[cond.idx])
                    })

                    handledChildren.push(transformIfMerge2LimboIfMerge(merge))
                    handleChildIdx = endIdx + 1
                    break 
                }

                handleChildIdx++
                handledChildren.push(children[i] as INode)
            }
        }
    }

    for(let i = handleChildIdx; i < children.length; i++) handledChildren.push(children[i] as INode)

    return handledChildren
}

const transform = (node: INode): INode => {
    let { children } = node as any as Omit<INode, 'children'> & {children: (INode | LimboIfMerge | IfMerge)[]}
    let ifMerge: IfMerge, Merges: Merge[] = []

    if(!children) children = []

    // resolve inner directive
    for(let idx = 0; idx < children.length; idx++) {
        const child = children[idx] as INode
        let ifCond, elifCond, elseCond
        let descriminat: string
        let circular: ForMerge | null
        
        let condIdx: number,
            circularIdx: number

        child.attributes?.forEach((attr, i) => {
            if(!ifCond && !elifCond && !elseCond) {
                // resolve condition
                if(attr.name === 'l-if') ifCond = true
                else if(attr.name === 'l-elif') elifCond = true
                else if(attr.name === 'l-else') elseCond = true
                if(ifCond || elifCond || elseCond) {
                    descriminat = attr.value
                    condIdx = i
                    return true
                }
            }
            
            // resolve circular
            // l-for="val in data"
            if(attr.name === 'l-for') {
                circularIdx = i
                const forBody = attr.value?.match(forBodyPat)
                if(!forBody) throw new Error(`l-for use like 'val in data'`)

                let {key, data} = forBody.groups
                key = key.replace(parenthesisPat, '')

                const maybeIdxAndVal = key.split(',')
                circular = {
                    forBody: data,
                    forVal: maybeIdxAndVal[0],
                    forIdx: maybeIdxAndVal[1],
                    comp: child,
                    type: MergeType.ForMerge,
                    idx: idx
                }
                Merges.push(circular)
            }
        })

        // delele l-for 
        // avoid reverse in child attrsList
        if(circularIdx !== undefined) child.attributes.splice(circularIdx, 1)

        if(descriminat) {
            const cond = {
                idx: idx, 
                cond: {
                    descriminat,
                    comp: transform(child)
                }
            }

            if(ifCond) {
                ifMerge = { if: cond, type: MergeType.IfMerge, endIdx: idx }
                Merges.push(ifMerge)
            } else if(elifCond) {
                ifMerge.endIdx = idx
                if(!ifMerge.elif) ifMerge.elif = []
                ifMerge.elif.push(cond)
            } else if(elseCond) {
                ifMerge.endIdx = idx
                ifMerge.else = cond
                ifMerge = null
            }

            child.attributes.splice(condIdx, 1)
        }        
    }

    if(Merges.length) node.children = compileCondChildren(Merges, children as (Merge | INode)[]) as any
    if(node.attributes) node.attributes = node.attributes.map(attr => handleAttr(attr)) as any

    return node
}

const handleAttr = (attr: ParserAttr): LimboAttr => {
    const limboAttr = handleDirective(attr)
    return limboAttr
}  

const handleDirective = (attr: ParserAttr): LimboAttr => {
    const {name, value} = attr
    if(name.startsWith('l-bind:')) {
        return {
            name: name.split(':')[1],
            value,
            dataKey: value
        }
    }

    return attr
}

export {
    transform,
    MergeType
}