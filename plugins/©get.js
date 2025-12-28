import fetch from 'node-fetch'
import { format } from 'util'

let handler = async (m, { conn, text }) => {
if (m.fromMe) return
if (!/^https?:\/\//.test(text)) return m.reply(`Por favor, ingresa la *url* de la pagina.`)

let url = text
await m.react('🕒')

try {
let res = await fetch(url, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
}
})

let contentLength = res.headers.get('content-length')
if (contentLength && parseInt(contentLength) > 200 * 1024 * 1024) {
return m.reply(`El archivo es demasiado pesado para enviarlo.`)
}

let contentType = res.headers.get('content-type')

if (!/text|json/.test(contentType)) {
await conn.sendFile(m.chat, url, 'archivo', text, m)
await m.react('✔️')
return
}

let txt = await res.buffer()
try {
txt = format(JSON.parse(txt + ''))
} catch (e) {
txt = txt + ''
} finally {
m.reply(txt.slice(0, 65536) + '')
await m.react('✔️')
}
} catch (e) {
console.error(e)
m.reply(`Error al intentar obtener el archivo.`)
}
}

handler.command = ['get']

export default handler
