"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const error_1 = require("./error");
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
            error_1.errors(error_1.Errors.CommentNotMatchEnd, { line, column });
        }
        return comment;
    };
    const readTag = () => {
        let resolveTagName = true;
        let char;
        let tag = '';
        let attrStart;
        let readyResolveValue = false;
        let valueStart;
        let valueEnd;
        const attributes = [];
        let binding = 0;
        const flushAttr = () => {
            if (!attrStart)
                return;
            // clearSpacingAndEqPat
            const name = source.slice(attrStart, valueStart ? valueStart - 1 : index).replace(/[ ]*=[ ]*$/, '');
            if (readyResolveValue && !valueStart && !valueEnd) {
                const { line, column } = debugMap[attrStart];
                error_1.errors(error_1.Errors.LackPropertyValue, { attr: name, line, column });
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
        };
        while (true) {
            char = readNext();
            if (index === source.length)
                error_1.errors(error_1.Errors.ResolveOverflowLength);
            if (char !== '>' && char !== '/' && !resolveTagName && !attrStart && /\S/.test(char))
                attrStart = index;
            // resolve end
            if (char === '>') {
                // 不需要关闭符
                const autoCloseTags = ['fragment', 'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
                const autoCloseTag = autoCloseTags.indexOf(tag) !== -1;
                // <tag />
                const isClose = source[index - 1] === '/';
                const tagNode = {
                    tag,
                    children: [],
                    type: 'node',
                    attributes,
                    closed: isClose || autoCloseTag
                };
                return tagNode;
            }
            else if (char === '/') {
                flushAttr();
            }
            else if (char === '<') {
                new Error('todo: error-5');
            }
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
                if (readyResolveValue)
                    readyResolveValue = false;
                binding++;
            }
            else if (char === '}') {
                if (!binding)
                    new Error('todo: error-4');
                binding--;
                if (!binding)
                    flushAttr();
            }
            else if (char === '=') {
                readyResolveValue = true;
            }
            else if (attrStart && /\s/.test(char) && /\S/.test(source[index + 1])) {
                flushAttr();
                continue;
            }
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
    const walk = (parent) => {
        let textNode = null;
        const flushText = () => {
            if (textNode) {
                parent.children.push(textNode);
                textNode = null;
            }
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
                else if (source[index + 1] === '/') {
                    let tag = '';
                    let char = readSkipNest(2);
                    while (char !== '>' && index < source.length) {
                        tag += char;
                        char = readNext();
                    }
                    if (tag !== parent.tag) {
                        error_1.errors(error_1.Errors.UnexpectedTagClose, { line, column, tag, correct: parent.tag });
                    }
                    return;
                }
                const node = readTag();
                parent.children.push(node);
                if (node.closed)
                    continue;
                walk(node);
            }
            if (!textNode) {
                textNode = {
                    type: 'text',
                    content: '',
                    closed: true
                };
            }
            textNode.content += char;
        }
    };
    const root = {
        type: 'root',
        children: [],
        tag: null,
        closed: true
    };
    walk(root);
    debugger;
    return root;
}
exports.parse = parse;
