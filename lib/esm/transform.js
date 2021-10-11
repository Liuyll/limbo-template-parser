/**
 * 将parser解析的结果做二次处理
 */
const forBodyPat = /(?<key>.*) in (?<data>.*)/;
const parenthesisPat = /[\(|\)]/;
var MergeType;
(function (MergeType) {
    MergeType[MergeType["ForMerge"] = 1] = "ForMerge";
    MergeType[MergeType["IfMerge"] = 2] = "IfMerge";
})(MergeType || (MergeType = {}));
const transformIfMerge2LimboIfMerge = (ifMerge) => {
    const handled = ['if', 'elif', 'else'];
    const LimboIfMerge = { type: MergeType.IfMerge };
    handled.forEach((key) => {
        if (ifMerge[key]) {
            if (key !== 'elif')
                LimboIfMerge[key] = ifMerge[key].cond;
            else
                LimboIfMerge[key] = ifMerge[key].map((cond) => cond.cond);
        }
    });
    return LimboIfMerge;
};
const compileCondChildren = (Merges, _children) => {
    let handleChildIdx = 0, handledChildren = [];
    const children = [..._children];
    // merge for
    for (let i = 0; i < Merges.length; i++) {
        const merge = Merges[i];
        if (merge.type === MergeType.ForMerge) {
            const { idx } = merge;
            const limboForMerge = Object.assign({}, merge);
            delete limboForMerge.idx;
            children[idx] = limboForMerge;
        }
    }
    // merge if
    for (let i = 0; i < Merges.length; i++) {
        const merge = Merges[i];
        if (merge.type === MergeType.IfMerge) {
            const { endIdx, if: ifCond } = merge;
            if (!ifCond || endIdx === undefined)
                continue;
            const startIdx = ifCond.idx;
            for (let i = handleChildIdx; i < children.length; i++) {
                if (i >= startIdx) {
                    // reserve forMerge
                    Object.entries(merge).forEach(([key, val]) => {
                        if (key === 'if' || key === 'else')
                            val.comp = children[val.idx];
                        else if (key === 'elif')
                            val.forEach((cond) => cond.cond.comp = children[cond.idx]);
                    });
                    handledChildren.push(transformIfMerge2LimboIfMerge(merge));
                    handleChildIdx = endIdx + 1;
                    break;
                }
                handleChildIdx++;
                handledChildren.push(children[i]);
            }
        }
    }
    for (let i = handleChildIdx; i < children.length; i++)
        handledChildren.push(children[i]);
    return handledChildren;
};
const transform = (node) => {
    var _a;
    let { children } = node;
    let ifMerge, Merges = [];
    if (!children)
        children = [];
    // resolve inner directive
    for (let idx = 0; idx < children.length; idx++) {
        const child = children[idx];
        let ifCond, elifCond, elseCond;
        let descriminat;
        let circular;
        let condIdx, circularIdx;
        (_a = child.attributes) === null || _a === void 0 ? void 0 : _a.forEach((attr, i) => {
            var _a;
            if (!ifCond && !elifCond && !elseCond) {
                // resolve condition
                if (attr.name === 'l-if')
                    ifCond = true;
                else if (attr.name === 'l-elif')
                    elifCond = true;
                else if (attr.name === 'l-else')
                    elseCond = true;
                if (ifCond || elifCond || elseCond) {
                    descriminat = attr.value;
                    condIdx = i;
                    return true;
                }
            }
            // resolve circular
            // l-for="val in data"
            if (attr.name === 'l-for') {
                circularIdx = i;
                const forBody = (_a = attr.value) === null || _a === void 0 ? void 0 : _a.match(forBodyPat);
                if (!forBody)
                    throw new Error(`l-for use like 'val in data'`);
                let { key, data } = forBody.groups;
                key = key.replace(parenthesisPat, '');
                const maybeIdxAndVal = key.split(',');
                circular = {
                    forBody: data,
                    forVal: maybeIdxAndVal[0],
                    forIdx: maybeIdxAndVal[1],
                    comp: transform(child),
                    type: MergeType.ForMerge,
                    idx: idx
                };
                Merges.push(circular);
            }
        });
        // delele l-for 
        // avoid reverse in child attrsList
        if (circularIdx !== undefined)
            child.attributes.splice(circularIdx, 1);
        if (descriminat) {
            const cond = {
                idx: idx,
                cond: {
                    descriminat,
                    comp: transform(child)
                }
            };
            if (ifCond) {
                ifMerge = { if: cond, type: MergeType.IfMerge, endIdx: idx };
                Merges.push(ifMerge);
            }
            else if (elifCond) {
                ifMerge.endIdx = idx;
                if (!ifMerge.elif)
                    ifMerge.elif = [];
                ifMerge.elif.push(cond);
            }
            else if (elseCond) {
                ifMerge.endIdx = idx;
                ifMerge.else = cond;
                ifMerge = null;
            }
            child.attributes.splice(condIdx, 1);
        }
        if (!circularIdx && !descriminat)
            children[idx] = transform(child);
    }
    if (Merges.length)
        node.children = compileCondChildren(Merges, children);
    if (node.attributes)
        node.attributes = node.attributes.map(attr => handleAttr(attr));
    return node;
};
const handleAttr = (attr) => {
    const limboAttr = handleDirective(attr);
    return limboAttr;
};
const handleDirective = (attr) => {
    const { name, value } = attr;
    if (name.startsWith('l-bind:')) {
        return {
            name: name.split(':')[1],
            value,
            dataKey: value
        };
    }
    return attr;
};
export { transform, MergeType };
