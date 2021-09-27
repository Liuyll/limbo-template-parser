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

export {
    INode,
    ITextNode,
    ICommentNode,
    INodeAttr
}