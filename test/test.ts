import { parse } from '../src/parser'
import { transform } from '../src/transform'

const template = `<div l-if="qwe" l-bind:bo="qwq"></div><div l-else="z"></div>`

console.log(transform(parse(template)).children[0])