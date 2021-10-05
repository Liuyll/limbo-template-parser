import { INode } from './interface'
import { parse } from './parser'
import { transform as _transform, MergeType } from './transform'

const transform = (template: string): INode => {
    return _transform(parse(template))
}

export {
    parse,
    _transform,
    transform,
    MergeType
}