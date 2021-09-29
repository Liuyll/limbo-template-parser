interface INode {
    tag ?: string,
    children ?: INode[],
    type: string,
    attributes ?: INodeAttr[],
    closed: boolean,
    content ?: string
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

type LimboAttr = {
    dataKey?: string
} & ParserAttr

export {
    INode,
    ITextNode,
    ICommentNode,
    INodeAttr,
    ParserAttr,
    LimboAttr
}