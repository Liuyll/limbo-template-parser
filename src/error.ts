type ErrorOptions = {
    line: number
    column: number
    [key: string]: any
}

const unexpectedChar = (options: ErrorOptions): string => {
    const { char, line, column } = options
    return `unexpected char '${char}'. position: line: ${line}, column: ${column}`
}

const unexpectedRightBrace = (options: ErrorOptions): string => {
    const { line, column } = options
    return `right brace have't match left brace. position: line: ${line}, column: ${column}`
}

const commentNotMatchEnd = (options: ErrorOptions): string => {
    const { line, column } = options
    return `comment is not end flag. position: line: ${line}, column: ${column}`
}

const unexpectedTagClose = (options: ErrorOptions): string => {
    const { line, column, correct, tag } = options
    return `close tagName is unexpected, expect: ${correct} got: ${tag}. position: line: ${line}, column: ${column}`
}

const resolveOverflowLength = (): string => {
    return 'resolve overflow length!'
}

const lackPropertyValue = (options: ErrorOptions): string => {
    const { attr, line, column } = options
    return `attr:${attr} lack property value but got an "=". position: line: ${line}, column: ${column}`
}

const unexpectedConditionDirective = (options: ErrorOptions): string => {
    const {condition, line, column} = options
    return `unexpected condition directive ${condition} line: ${line}, column: ${column}`
}


enum Errors {
    CommentNotMatchEnd = 0,
    UnexpectedTagClose,
    ResolveOverflowLength,
    LackPropertyValue, // 存在等号却没有对应的value
    UnexpectedConditionDirective, // 不正确位置的l-elif、l-else
    UnexpectedRightBrace, // 没有对应匹配的大括号,
    UnexpectedChar, // 不能解析的符号
}

const errors = (type: Errors, options ?: ErrorOptions) => {
    let str: string

    switch (type) {
        case Errors.CommentNotMatchEnd:
            str = commentNotMatchEnd(options)
            break
        case Errors.UnexpectedTagClose:
            str = unexpectedTagClose(options)
            break
        case Errors.ResolveOverflowLength:
            str = resolveOverflowLength()
            break
        case Errors.LackPropertyValue:
            str = lackPropertyValue(options)
            break
        case Errors.UnexpectedConditionDirective:
            str = unexpectedConditionDirective(options)
            break
        case Errors.UnexpectedRightBrace:
            str = unexpectedRightBrace(options)
            break
        case Errors.UnexpectedChar:
            str = unexpectedChar(options)
            break
    }

    throw new Error(str)
}

export {
    Errors,
    errors
}