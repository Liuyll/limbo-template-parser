import { parse } from '../src/parser'
import { transform } from '../src/transform'

const template = `<div l-if="d">{{zzxx}}</div>`

console.log(parse(template).children[0].children)