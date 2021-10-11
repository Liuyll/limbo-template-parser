import { parse } from '../src/parser'
import { transform } from '../src/transform'

const template = `
    <div>
        <div>12</div>
        // <div>343r</div>
        <div>fds</div>
    </div>
`

console.log(parse(template).children[1].children)