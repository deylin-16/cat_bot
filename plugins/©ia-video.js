import { aiLabs } from '../lib/ailabs.js'

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, `Uso:
${usedPrefix + command} <prompt>

Comandos:
${usedPrefix}ailabsimg <prompt>  (genera imagen)
${usedPrefix}ailabsvideo <prompt> (genera video)`, m,rcanal)

  const isImage = /img$/i.test(command)
  const type = isImage ? 'image' : 'video'
  await conn.reply(m.chat, `Generando ${type === 'image' ? 'imagen' : 'video'}...`, m)
  const res = await aiLabs.generate({ prompt: text, type })

  if (!res.success) {
    return conn.reply(m.chat, `❌ Error (${res.code}): ${res.result.error}`, m)
  }

  if (type === 'image') {
    return conn.sendMessage(m.chat, { image: { url: res.result.url }, caption: ` Imagen generada` }, { quoted: m })
  }

  return conn.sendMessage(m.chat, { video: { url: res.result.url }, caption: ' Video generado' }, { quoted: m })
}

handler.help = ['ailabsimg <prompt>', 'ailabsvideo <prompt>']
handler.tags = ['ai']
handler.command = ['ailabsimg', 'ailabsvideo']
handler.limit = true

export default handler