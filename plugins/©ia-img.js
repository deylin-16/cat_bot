import { aiLabs } from '../lib/ailabs.js'
import fetch from 'node-fetch'

let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, `🧠 *Uso correcto:*
${usedPrefix + command} <prompt>

📸 *Ejemplo:*
${usedPrefix + command} gato samurái con armadura futurista`, m)

  await conn.reply(m.chat, `🍪 Generando imagen...`, m)
  const res = await aiLabs.generate({ prompt: text, type: 'image' })

  if (!res.success) {
    return conn.reply(m.chat, `❌ Error (${res.code}): ${res.result?.error || 'No se pudo generar la imagen'}`, m)
  }

  let imageBuffer;
  try {
      const response = await fetch(res.result.url);
      imageBuffer = await response.buffer();
  } catch (error) {
      console.error("Error al descargar la imagen:", error);
      return conn.reply(m.chat, `❌ Error al descargar la imagen generada.`, m);
  }

  return conn.sendMessage(
    m.chat,
    {
      image: imageBuffer,
      caption: ` *Imagen generada con IA*`
    },
    { quoted: m }
  )
}

handler.command = ['iaimg', 'imgg', 'aimg', 'genimg']

export default handler