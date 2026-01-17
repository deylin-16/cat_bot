import syntaxerror from 'syntax-error'
import { format } from 'util'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'
import fs from 'fs'
import fetch from 'node-fetch'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)

let handler = async (m, _2) => {
  let { conn, usedPrefix, noPrefix, args, groupMetadata } = _2
  
  // Variables que estarán disponibles directamente en el comando
  let _return
  let _syntax = ''
  let _text = (/^=/.test(usedPrefix) ? 'return ' : '') + noPrefix
  
  try {
    // Definimos el contexto de ejecución con acceso a global y módulos
    let exec = new (async () => { }).constructor(
      'print', 
      'm', 
      'handler', 
      'require', 
      'conn', 
      'Array', 
      'process', 
      'args', 
      'groupMetadata', 
      'module', 
      'exports', 
      'argument', 
      'p', 
      'fs', 
      'fetch',
      'global',
      _text
    )

    const printFunc = (...args) => {
      return conn.reply(m.chat, format(...args), m)
    }

    // Pasamos las instancias reales para que m.chat o global.db funcionen
    _return = await exec.call(
      conn, 
      printFunc, 
      m, 
      handler, 
      require, 
      conn, 
      CustomArray, 
      process, 
      args, 
      groupMetadata, 
      { exports: {} }, 
      {}, 
      [conn, _2], 
      printFunc, 
      fs, 
      fetch,
      global
    )
  } catch (e) {
    let err = syntaxerror(_text, 'Execution Function', {
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      sourceType: 'module'
    })
    if (err) _syntax = '```' + err + '```\n\n'
    _return = e
  } finally {
    // Si el comando devuelve algo, lo enviamos al chat
    if (_return !== undefined) {
      conn.reply(m.chat, _syntax + format(_return), m)
    }
  }
}

handler.help = ['=>'] 
handler.tags = ['owner']
handler.command = ['=>']
handler.rowner = true

export default handler

class CustomArray extends Array {
  constructor(...args) {
    if (typeof args[0] == 'number') return super(Math.min(args[0], 10000))
    else return super(...args)
  }
}
