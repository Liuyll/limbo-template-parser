import { parse } from './parser';
import { transform as _transform, MergeType } from './transform';
const transform = (template) => {
    return _transform(parse(template));
};
export { parse, _transform, transform, MergeType };
