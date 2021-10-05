import { parse } from '../src/parser'
import { transform } from '../src/transform'

const template = `<div l-bind:class="d" l-if="d"><button @click="() => setD(false)">zxcc</button></div>
<div l-elif="e"><button @click="() => setD(true)">else</button></div>`

console.log(parse(template).children[0].attributes)