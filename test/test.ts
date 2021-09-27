import { parse } from '../src/parser'

const template = `
    <div test test1="qwe"> 
        sdf 
        <span>qwe</span>
    </div>
`

console.log(parse(template))