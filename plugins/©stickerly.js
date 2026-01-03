import fetch from 'node-fetch'
import { Sticker } from 'wa-sticker-formatter'

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(` Escribe un término de búsqueda para buscar los stickers.`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !Array.isArray(searchJson.data) || searchJson.data.length === 0) {
      return m.reply('❌ No se encontraron stickers.')
    }

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    const packName = pick.name || 'Sin nombre'
    const authorName = pick.author || 'Desconocido'

    m.reply(`🎉 Pack encontrado: *${packName}* de *${authorName}*\n📦 Enviando 5 stickers...`)

    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    if (!downloadJson.status || !downloadJson.data || !Array.isArray(downloadJson.data.stickers)) {
      return m.reply('⚠️ No se pudieron descargar stickers.')
    }

    const stickersToSend = downloadJson.data.stickers.slice(0, 5)

    for (let i = 0; i < stickersToSend.length; i++) {
      const sticker = new Sticker(stickersToSend[i], {
        pack: packName,
        author: authorName,
        type: 'full',
        categories: ['🔥'],
        id: `delirius-${i}`
      })
      const buffer = await sticker.toBuffer()
      await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al procesar los stickers.')
  }
}

handler.command = ['stikerly', 'sly']

export default handler