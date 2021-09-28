import { parse } from '../src/parser'

const template = `
    <div l-for="item in items" :key = "item" test></div>
`

console.log(parse(template).children[1])