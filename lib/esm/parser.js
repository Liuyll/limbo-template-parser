import { Errors, errors } from './error';
const innerDirectiveLists = {
    'l-for': 4,
    'l-if': 3,
    'l-else': 5,
    'l-elif': 5,
    'l-bind': 5,
    'l-key': 4,
};
function parse(source) {
    // readNext index++ = 0
    let index = -1;
    let line = 1;
    let column = 0;
    const debugMap = {};
    const readComment = () => {
        const start = index;
        let comment;
        let char = source[index];
        // ..-->
        while (index < source.length - 3) {
            if (char === '-' && source.slice(index, index + 3) === '-->') {
                comment = source.slice(start, index);
                break;
            }
            char = readNext();
        }
        if (!comment) {
            errors(Errors.CommentNotMatchEnd, { line, column });
        }
        return comment;
    };
    /**
     * resolve <tag attr1 attr2> || <tag attr1 attr2 /> (closed)
     */
    const readTag = (sibling) => {
        let resolveTagName = true;
        let resolveDirective = false; // handle l-for etc...
        let char;
        let tag = '';
        let attrStart;
        let readyResolveValue = false;
        let valueStart;
        let valueEnd;
        let unHandleSpacing = false; // 未处理的空格
        let existCondition = false;
        const attributes = [];
        const flushAttr = () => {
            if (!attrStart)
                return;
            // clearSpacingAndEqPat
            // eg: key = value | key (spacing suffix) 
            const name = source.slice(attrStart, valueStart ? valueStart - 1 : index).replace(/[ ]*=?[ ]*$/, '');
            if (readyResolveValue && !valueStart && !valueEnd) {
                const { line, column } = debugMap[attrStart];
                errors(Errors.LackPropertyValue, { attr: name, line, column });
            }
            let value;
            if (!valueStart)
                value = true;
            else
                value = source.slice(valueStart, valueEnd);
            const attr = {
                name,
                value
            };
            attributes.push(attr);
            attrStart = null;
            valueStart = null;
            valueEnd = null;
            readyResolveValue = false;
            unHandleSpacing = false;
            resolveDirective = false;
        };
        // eslint-disable-next-line no-constant-condition
        while (true) {
            char = readNext();
            if (index === source.length)
                errors(Errors.ResolveOverflowLength);
            // l-xxx 内置指令
            if (char === 'l' && peep(1) === '-') {
                // 最长的指令是l-else
                const maybeDirectiveStr = char + peep(5).replace(' ', '').replace(/=.*/, "");
                if (maybeDirectiveStr in innerDirectiveLists) {
                    // check
                    if (maybeDirectiveStr === 'l-else' || maybeDirectiveStr === 'l-elif' && (sibling && !sibling.condition)) {
                        console.log(sibling);
                        errors(Errors.UnexpectedConditionDirective, { condition: maybeDirectiveStr, line, column });
                    }
                    if (maybeDirectiveStr === 'l-if' || maybeDirectiveStr === 'l-elif')
                        existCondition = true;
                    const directiveLength = innerDirectiveLists[maybeDirectiveStr];
                    attrStart = index;
                    resolveDirective = true;
                    readSkipNest(directiveLength);
                    continue;
                }
            }
            // attrName start
            if (char !== '>' && char !== '/' && !resolveTagName && /\S/.test(char)) {
                if (unHandleSpacing && attrStart && !resolveDirective) {
                    flushAttr();
                    attrStart = index;
                }
                else if (!attrStart)
                    attrStart = index;
            }
            // resolve end
            if (char === '>') {
                // attr没有处理完
                if (attrStart)
                    flushAttr();
                // 不需要关闭符
                const autoCloseTags = ['fragment', 'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
                const autoCloseTag = autoCloseTags.indexOf(tag) !== -1;
                // <tag />
                const isClose = peep(-1) === '/';
                const tagNode = {
                    tag,
                    children: [],
                    type: 'node',
                    attributes,
                    closed: isClose || autoCloseTag,
                    condition: existCondition
                };
                return tagNode;
            }
            else if (char === '/') {
                flushAttr();
            }
            // tag start
            else if (char === '<') {
                throw new Error('todo: error-5');
            }
            // attributes value start
            // eg: l-key="value"
            else if (char === '"' || char === '\'' || char === '`') {
                if (readyResolveValue) {
                    readyResolveValue = false;
                    valueStart = index + 1;
                    while (char !== readNext())
                        ;
                    valueEnd = index;
                    flushAttr();
                }
                else {
                    while (char !== readNext())
                        ;
                }
            }
            else if (char === '{') {
                errors(Errors.UnexpectedChar, { column, line, char });
            }
            else if (char === '}') {
                errors(Errors.UnexpectedChar, { column, line, char });
            }
            else if (char === '=') {
                readyResolveValue = true;
            }
            else if (attrStart && /\s/.test(char)) {
                unHandleSpacing = true;
                continue;
            }
            // else if(attrStart && /\s/.test(char) && /\S/.test(source[index + 1])) {
            //     flushAttr()
            //     continue
            // }
            if (resolveTagName) {
                /**
                 * \d: h1,h2...
                 */
                if (/[\da-zA-Z]/.test(char)) {
                    tag += char;
                }
                else {
                    resolveTagName = false;
                }
            }
        }
    };
    const readNext = () => {
        index++;
        const char = source[index];
        if (char === '\n') {
            line++;
            column = 1;
        }
        else {
            column++;
        }
        debugMap[index] = {
            line,
            column
        };
        return char;
    };
    const readSkipNest = (skip) => {
        let char = '';
        for (let i = 0; i < skip; i++) {
            char = readNext();
        }
        return char;
    };
    const peep = (skip) => {
        if (skip < 0)
            return source.slice(index + skip, index);
        return source.slice(index + 1, index + skip + 1);
    };
    const walk = (parent) => {
        var _a;
        let textNode = null;
        let binding = 0;
        const flushText = () => {
            if (textNode) {
                parent.children.push(textNode);
                textNode = null;
            }
        };
        const addCharToContent = (c) => {
            if (!textNode)
                throw new Error('textNode is not existed.');
            textNode.content += c;
        };
        while (index < source.length) {
            let char = readNext();
            if (char === '<') {
                flushText();
                // comment
                if (source.slice(index, index + 4) === '<!--') {
                    index += 4;
                    parent.children.push({
                        type: 'comment',
                        tag: null,
                        comment: readComment()
                    });
                }
                // close
                else if (peep(1) === '/') {
                    let tag = '';
                    let char = readSkipNest(2); // match '<tag />'
                    while (char !== '>' && index < source.length) {
                        // match <tag></tag>
                        tag += char;
                        char = readNext();
                    }
                    if (tag !== parent.tag) {
                        errors(Errors.UnexpectedTagClose, { line, column, tag, correct: parent.tag });
                    }
                    return;
                }
                const node = readTag((_a = parent === null || parent === void 0 ? void 0 : parent.children) === null || _a === void 0 ? void 0 : _a.slice(-1)[0]);
                parent.children.push(node);
                if (node.closed)
                    continue;
                walk(node);
                continue;
            }
            if (char === '{') {
                if (textNode) {
                    if (!binding)
                        flushText();
                    else
                        addCharToContent(char);
                }
                else {
                    textNode = {
                        type: 'expression',
                        content: '',
                        closed: true
                    };
                }
                binding++;
                continue;
            }
            if (char === '}') {
                if (!binding)
                    errors(Errors.UnexpectedRightBrace, { line, column });
                binding--;
                if (!binding)
                    flushText();
                else
                    addCharToContent(char);
                continue;
            }
            if (!textNode && (char === ' ' || char === '\n' || char === '\r\n')) {
                continue;
            }
            if (!textNode) {
                textNode = {
                    type: 'text',
                    content: '',
                    closed: true
                };
            }
            addCharToContent(char);
        }
    };
    const root = {
        type: 'root',
        children: [],
        tag: null,
        closed: true
    };
    walk(root);
    return root;
}
export { parse };
