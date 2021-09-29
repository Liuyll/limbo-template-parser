import { Errors, errors } from './error'
import { INode, ICommentNode } from './interface'

const innerDirectiveLists = {
    'l-for': 4,
    'l-if': 3,
    'l-else': 5,
    'l-elif': 5,
    'l-bind': 5,
    'l-key': 4,
}

function parse(source: string): INode {
    // readNext index++ = 0
    let index = -1
    let line = 1
    let column = 0
    const debugMap = {}

    let unEndCondition = false // 未结束的l-if

    const readComment = (): string => {
        const start = index
        let comment: string
        let char = source[index]
        // ..-->
        while(index < source.length - 3) {
            if(char === '-' && source.slice(index, index + 3) === '-->') {
                comment = source.slice(start, index)
                break
            } 
           char = readNext()
        }
        if(!comment) {
            errors(Errors.CommentNotMatchEnd, { line, column })
        }

        return comment
    }

    const readTag = (): INode => {
        let resolveTagName = true

        let char: string
        let tag = ''
        let attrStart: number
        let readyResolveValue = false
        let valueStart: number
        let valueEnd: number
        const attributes = []
        let binding: number = 0
        let unHandleSpacing = false // 未处理的空格
        let existCondition = false

        const flushAttr = () => {
            if(!attrStart) return

            // clearSpacingAndEqPat
            // eg: key = value | key (spacing suffix) 
            const name = source.slice(attrStart, valueStart ? valueStart - 1 : index).replace(/[ ]*=?[ ]*$/, '')

            if(readyResolveValue && !valueStart && !valueEnd) {
                const { line, column } =  debugMap[attrStart]
                console.log(attrStart, valueStart)
                errors(Errors.LackPropertyValue, { attr: name, line, column })
            }

            let value: boolean | string
            if(!valueStart) value = true
            else value = source.slice(valueStart, valueEnd)
            
            const attr = {
                name,
                value
            }
            attributes.push(attr)

            attrStart = null
            valueStart = null
            valueEnd = null
            readyResolveValue = false
            unHandleSpacing = false
        }

        while(true) {
            char = readNext()
            if(index === source.length) errors(Errors.ResolveOverflowLength)

            // l-xxx 内置指令
            if(char === 'l' && peep(1) === '-') {
                // 最长的指令是l-else
                const maybeDirectiveStr = char + peep(5).replace(' ', '').replace(/=.*/, "")
                if(maybeDirectiveStr in innerDirectiveLists) {
                    // check
                    if(maybeDirectiveStr === 'l-else' || maybeDirectiveStr === 'l-elif') {
                        if(!unEndCondition) errors(Errors.UnexpectedConditionDirective, {condition: maybeDirectiveStr, line, column})
                        existCondition = true
                    }

                    if(maybeDirectiveStr === 'l-if') {
                        existCondition = true
                        unEndCondition = true
                    }

                    const directiveLength = innerDirectiveLists[maybeDirectiveStr]
 
                    attrStart = index
                    readSkipNest(directiveLength)
                    continue 
                }
            }

            // attrName start
            if(char !== '>' && char !== '/' && !resolveTagName && /\S/.test(char)) {
                if(unHandleSpacing && attrStart) {
                    flushAttr()
                    attrStart = index
                } else if(!attrStart) attrStart = index
            }

            // resolve end
            if(char === '>') {
                // attr没有处理完
                if(attrStart) flushAttr()

                // 不需要关闭符
                const autoCloseTags = ['fragment', 'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
                const autoCloseTag = autoCloseTags.indexOf(tag) !== -1
                
                // <tag />
                const isClose = peep(-1) === '/'

                const tagNode: INode = {
                    tag,
                    children: [],
                    type: 'node',
                    attributes,
                    closed: isClose || autoCloseTag
                }

                if(!existCondition) unEndCondition = false
                return tagNode
            }

            else if(char === '/') {
                flushAttr()
            }
            
            // tag start
            else if(char === '<') {
                throw new Error('todo: error-5')
            } 

            // attributes value start
            // eg: l-key="value"
            else if(char === '"' || char === '\'' || char === '`') {
                if(readyResolveValue) {
                    readyResolveValue = false
                    valueStart = index + 1
                    while(char !== readNext());
                    valueEnd = index
                    flushAttr()
                } else {
                    while(char !== readNext());
                }
            }

            else if(char === '{') {
                if(readyResolveValue) readyResolveValue = false
                binding++
            } 

            else if(char === '}') {
                if(!binding) new Error('todo: error-4')
                binding--
                if(!binding) flushAttr()
            }

            else if(char === '=') {
                readyResolveValue = true
            } 

            else if(attrStart && /\s/.test(char)) {
                unHandleSpacing = true
                continue
            }
            
            // else if(attrStart && /\s/.test(char) && /\S/.test(source[index + 1])) {
            //     flushAttr()
            //     continue
            // }

            if(resolveTagName) {
                /**
                 * \d: h1,h2...
                 */ 
                if(/[\da-zA-Z]/.test(char)) {
                    tag += char
                } else {
                    resolveTagName = false
                }
            }
        }

    }

    const readNext = (): string => {
        index++
        const char = source[index]
        if(char === '\n') {
            line++
            column = 1
        } else {
            column++
        }
        
        debugMap[index] = {
            line,
            column
        }

        return char
    }

    const readSkipNest = (skip: number): string => {
        let char = ''
        for(let i = 0; i < skip; i++) {
            char = readNext()
        }
        return char
    }

    const peep = (skip: number): string => {
        if(skip < 0) return source.slice(index + skip, index)
        return source.slice(index + 1, index + skip + 1)
    }

    const walk = (parent: INode) => {
        let textNode: INode = null
        const flushText = () => {
            if(textNode) {
                parent.children.push(textNode)
                textNode = null
            }
        }

        
        while(index < source.length) {
            let char = readNext()
            if(char === '<') {
                flushText()

                // comment
                if(source.slice(index, index + 4) === '<!--') {
                    index += 4
                    parent.children.push({
                        type: 'comment',
                        tag: null,
                        comment: readComment()
                    } as ICommentNode)
                }

                // close
                else if(peep(1) === '/') {
                    let tag = ''
                    let char = readSkipNest(2)
                    while(char !== '>' && index < source.length) {
                        tag += char
                        char = readNext()
                    }
                    if(tag !== parent.tag) {
                        errors(Errors.UnexpectedTagClose, { line, column, tag, correct: parent.tag })
                    }
                    return
                } 

                const node = readTag()
                parent.children.push(node)

                if(node.closed) continue
                walk(node)
                continue
            }

            if(!textNode) {
                textNode = {
                    type: 'text',
                    content: '',
                    closed: true
                }
            }
            textNode.content += char
        }
    }

    const root = {
        type: 'root',
        children: [],
        tag: null,
        closed: true
    }

    walk(root)
    return root
}

export {
    parse
}