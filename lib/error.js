"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = exports.Errors = void 0;
const unexpectedChar = (options) => {
    const { char, line, column } = options;
    return `unexpected char '${char}'. position: line: ${line}, column: ${column}`;
};
const unexpectedRightBrace = (options) => {
    const { line, column } = options;
    return `right brace have't match left brace. position: line: ${line}, column: ${column}`;
};
const commentNotMatchEnd = (options) => {
    const { line, column } = options;
    return `comment is not end flag. position: line: ${line}, column: ${column}`;
};
const unexpectedTagClose = (options) => {
    const { line, column, correct, tag } = options;
    return `close tagName is unexpected, expect: ${correct} got: ${tag}. position: line: ${line}, column: ${column}`;
};
const resolveOverflowLength = () => {
    return 'resolve overflow length!';
};
const lackPropertyValue = (options) => {
    const { attr, line, column } = options;
    return `attr:${attr} lack property value but got an "=". position: line: ${line}, column: ${column}`;
};
const unexpectedConditionDirective = (options) => {
    const { condition, line, column } = options;
    return `unexpected condition directive ${condition} line: ${line}, column: ${column}`;
};
var Errors;
(function (Errors) {
    Errors[Errors["CommentNotMatchEnd"] = 0] = "CommentNotMatchEnd";
    Errors[Errors["UnexpectedTagClose"] = 1] = "UnexpectedTagClose";
    Errors[Errors["ResolveOverflowLength"] = 2] = "ResolveOverflowLength";
    Errors[Errors["LackPropertyValue"] = 3] = "LackPropertyValue";
    Errors[Errors["UnexpectedConditionDirective"] = 4] = "UnexpectedConditionDirective";
    Errors[Errors["UnexpectedRightBrace"] = 5] = "UnexpectedRightBrace";
    Errors[Errors["UnexpectedChar"] = 6] = "UnexpectedChar";
})(Errors || (Errors = {}));
exports.Errors = Errors;
const errors = (type, options) => {
    let str;
    switch (type) {
        case Errors.CommentNotMatchEnd:
            str = commentNotMatchEnd(options);
            break;
        case Errors.UnexpectedTagClose:
            str = unexpectedTagClose(options);
            break;
        case Errors.ResolveOverflowLength:
            str = resolveOverflowLength();
            break;
        case Errors.LackPropertyValue:
            str = lackPropertyValue(options);
            break;
        case Errors.UnexpectedConditionDirective:
            str = unexpectedConditionDirective(options);
            break;
        case Errors.UnexpectedRightBrace:
            str = unexpectedRightBrace(options);
            break;
        case Errors.UnexpectedChar:
            str = unexpectedChar(options);
            break;
    }
    throw new Error(str);
};
exports.errors = errors;
