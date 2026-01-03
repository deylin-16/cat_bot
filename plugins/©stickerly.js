import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`✨ Escribe un término de búsqueda para buscar los stickers en Sticker.ly`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) {
      return m.reply('❌ No se encontraron resultados.')
    }

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    const packName = pick.name || 'Sasuke Pack'
    const authorName = pick.author || 'Deylin'

    await m.reply(`📦 *Pack:* ${packName}\n👤 *Autor:* ${authorName}\n\n_Enviando ráfaga de stickers..._`)

    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    if (!downloadJson.status || !downloadJson.data?.stickers) return m.reply('⚠️ Error al descargar.')

    const stickersToSend = downloadJson.data.stickers.slice(0, 10)

    for (let url of stickersToSend) {
      const sticker = new Sticker(url, {
        pack: packName,
        author: authorName,
        type: 'full',
        id: `sasuke-${Date.now()}`
      })
      
      const buffer = await sticker.toBuffer()
      // Enviamos sin 'quoted' para que WhatsApp no intente separarlos por el mensaje de referencia
      // Esto ayuda a que se agrupen visualmente mejor
      await conn.sendMessage(m.chat, { sticker: buffer })
    }

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al procesar el paquete.')
  }
}

handler.command = ['stikerly', 'sly']

export default handler
