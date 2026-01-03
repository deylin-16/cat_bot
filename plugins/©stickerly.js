import fetch from 'node-fetch'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`✨ Escribe un término para buscar stickers.`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) return m.reply('❌ Sin resultados.')

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    
    // Aviso de envío limitado para evitar spam
    await m.reply(`📦 *Pack:* ${pick.name || 'Sasuke'}\n🚀 Enviando 2 stickers optimizados...`)

    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    if (!downloadJson.status || !downloadJson.data?.stickers) return m.reply('⚠️ Error al descargar.')

    // Solo tomamos los primeros 2 stickers para no hacer spam
    const stickersToSend = downloadJson.data.stickers.slice(0, 2)

    for (let url of stickersToSend) {
      const sticker = new Sticker(url, {
        pack: pick.name || 'Sasuke Bot',
        author: 'Deylin',
        type: StickerTypes.FULL,
        categories: ['🔥'],
        id: `sask-${Date.now()}`,
        quality: 50 // Reducimos la calidad para que pesen poco y se agrupen
      })
      
      const buffer = await sticker.toBuffer()
      
      // Enviamos sin 'quoted' para facilitar que WhatsApp los agrupe visualmente
      await conn.sendMessage(m.chat, { sticker: buffer })
    }

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al procesar el pack.')
  }
}

handler.command = ['stikerly', 'sly']

export default handler
