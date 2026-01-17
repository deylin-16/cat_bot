import syntaxerror from 'syntax-error'
import { format } from 'util'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)

let handler = async (m, _2) => {
  let { conn, usedPrefix, noPrefix, args, groupMetadata } = _2
  let _return
  let _syntax = ''
  // Aquí se construye el cuerpo de la ejecución
  let _text = (/^=/.test(usedPrefix) ? 'return ' : '') + noPrefix
  let old = m.exp * 1
  
  try {
    let i = 15
    let f = { exports: {} }
    // Definición de la función asíncrona dinámica
    let exec = new (async () => { }).constructor(
      'print', 'm', 'handler', 'require', 'conn', 'Array', 'process', 'args', 'groupMetadata', 'module', 'exports', 'argument', 'p', 
      _text
    )

    const printFunc = (...args) => {
      if (--i < 1) return
      return conn.reply(m.chat, format(...args), m)
    };

    _return = await exec.call(conn, printFunc, m, handler, require, conn, CustomArray, process, args, groupMetadata, f, f.exports, [conn, _2], printFunc)
  } catch (e) {
    let err = syntaxerror(_text, 'Execution Function', {
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      sourceType: 'module'
    })
    if (err) _syntax = '```' + err + '```\n\n'
    _return = e
  } finally {
    conn.reply(m.chat, _syntax + format(_return), m)
    m.exp = old
  }
}

handler.help = ['=>'] 
handler.tags = ['owner']
handler.command = ['=>', '>'] // Añadí '>' para ejecución normal
handler.rowner = true

export default handler

class CustomArray extends Array {
  constructor(...args) {
    if (typeof args[0] == 'number') return super(Math.min(args[0], 10000))
    else return super(...args)
  }
}
