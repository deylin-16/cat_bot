import syntaxerror from 'syntax-error'
import { format, inspect } from 'util'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)

const evala = {
    name: 'eval',
    alias: ['await', 'exec'],
    category: 'owner',
    rowner: true,
    run: async (m, _2) => {
        let { conn, text, args, groupMetadata } = _2
        if (!text) return
        
        let _return
        let _text = text.trim()

        try {
            let exec = new (async () => { }).constructor(
                'print', 'm', 'handler', 'require', 'conn', 'Array', 'process', 'args', 'groupMetadata', 'module', 'exports', 'argument',
                `return (async () => { 
                    try { 
                        return ${_text} 
                    } catch (e) { 
                        return eval(\`${_text}\`)
                    }
                })()`
            )

            _return = await exec(
                console.log,
                m,
                evala,
                require,
                conn,
                CustomArray,
                process,
                args,
                groupMetadata,
                { exports: {} },
                {},
                [conn, _2]
            )

            if (_return && typeof _return === 'object') {
                _return = inspect(_return, { depth: 1, showHidden: false })
            }
        } catch (e) {
            _return = e
        } finally {
            let finalMsg = typeof _return === 'string' ? _return : format(_return)
            m.reply(finalMsg)
        }
    }
}

class CustomArray extends Array {
    constructor(...args) {
        if (typeof args[0] == 'number') return super(Math.min(args[0], 10000))
        else return super(...args)
    }
}

export default evala
