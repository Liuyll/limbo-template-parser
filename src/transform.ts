/**
 * 将parser解析的结果做二次处理
 */

import { INode, LimboAttr, ParserAttr } from "./interface";

type Condition = {
    descriminat: Function
    comp: INode
}

type IfMerge = {
    if: {idx: number, cond: Condition}
    elif?: {idx: number, cond: Condition}[],
    else?: {idx: number, cond: Condition}
}

const transform = (node: INode): INode => {
    const {children} = node
    let ifMerge: IfMerge
    for(let i = 0; i < children.length; i++) {
        const child = children[i]
        let ifCond, elifCond, elseCond
        const cond = {
            idx: i, cond: {
                descriminat: () => {},
                comp: transform(child)
            }
        }
        child.attributes?.forEach(attr => {
            if(attr.name === 'l-if') ifCond = true
            else if(attr.name === 'l-elif') elifCond = true
            else if(attr.name === 'l-else') elseCond = true
        })

        if(ifCond) {
            if(!ifMerge) {
                ifMerge = { if: cond }
            }
        } else if(elifCond) {
            if(!ifMerge.elif) ifMerge.elif = []
            ifMerge.elif.push(cond)
        } else if(elseCond) {
            ifMerge.else = cond
            ifMerge = null
        }
    }

    if(node.attributes) node.attributes = node.attributes.map(attr => handleAttr(attr))

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
    transform
}