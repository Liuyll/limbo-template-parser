type ErrorOptions = {
    line: number
    column: number
    [key: string]: any
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

const UnexpectedConditionDirective = (options: ErrorOptions): string => {
    const {condition, line, column} = options
    return `unexpected condition directive ${condition} line: ${line}, column: ${column}`
}


enum Errors {
    CommentNotMatchEnd = 0,
    UnexpectedTagClose,
    ResolveOverflowLength,
    LackPropertyValue,
    UnexpectedConditionDirective // 不正确位置的l-elif、l-else
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
            str = UnexpectedConditionDirective(options)
    }

    throw new Error(str)
}

export {
    Errors,
    errors
}