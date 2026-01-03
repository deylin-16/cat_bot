import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`✨ Escribe un término de búsqueda para buscar los stickers en Sticker.ly`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) {
      return m.reply('❌ No se encontraron resultados para tu búsqueda.')
    }

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    const packName = pick.name || 'Sasuke Pack'
    const authorName = pick.author || 'Deylin'

    await m.reply(`📦 *Pack:* ${packName}\n👤 *Autor:* ${authorName}\n\n_Preparando envío múltiple..._`)

    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    if (!downloadJson.status || !downloadJson.data?.stickers) {
      return m.reply('⚠️ Error al obtener los archivos del pack.')
    }

    const stickersToSend = downloadJson.data.stickers.slice(0, 5) // Aumentado a 10 stickers

    // Enviamos los stickers en una promesa masiva para que salgan casi al mismo tiempo
    await Promise.all(stickersToSend.map(async (url, i) => {
      const sticker = new Sticker(url, {
        pack: packName,
        author: authorName,
        type: 'full',
        categories: ['🔥'],
        id: `sasuke-${Date.now()}-${i}`
      })
      const buffer = await sticker.toBuffer()
      return conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
    }))

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un fallo al procesar el paquete de stickers.')
  }
}

handler.help = ['stikerly <búsqueda>']
handler.tags = ['sticker']
handler.command = ['stikerly', 'sly']

export default handler
