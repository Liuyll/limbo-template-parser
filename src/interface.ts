interface INode {
    tag ?: string,
    children ?: INode[],
    type: string,
    attributes ?: INodeAttr[],
    closed: boolean,
    content ?: string,
    condition ?: boolean
}

interface ITextNode extends INode {
    comment: string
}

type ICommentNode = ITextNode

interface INodeAttr {
    name: string,
    value: string,
    decorator ?: string
}

type ParserAttr = {
    name: string,
    value: string
}

type LimboBindAttr = {
    dataKey?: string
}

type LimboForAttr = {
    forBody?: string,
    forVal?: string,
    forIdx?: string
}

type LimboAttr = LimboBindAttr & LimboForAttr & Partial<ParserAttr>

export {
    INode,
    ITextNode,
    ICommentNode,
    INodeAttr,
    ParserAttr,
    LimboAttr
}