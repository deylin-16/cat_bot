import { aiLabs } from '../lib/ailabs.js'

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, `Uso:\n${usedPrefix + command} <prompt>`, m)

  await conn.reply(m.chat, `*Generando video...*`, m)
  
  try {
    const res = await aiLabs.generate({ prompt: text, type: 'video' })

    if (!res.success) {
      return conn.reply(m.chat, `❌ Error (${res.code}): ${res.result.error}`, m)
    }

    return conn.sendMessage(m.chat, { 
      video: { url: res.result.url }, 
      caption: `*Video generado con éxito..*` 
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    return conn.reply(m.chat, `❌ Ocurrió un fallo inesperado.`, m)
  }
}

handler.command = ['iavideo']

export default handler
