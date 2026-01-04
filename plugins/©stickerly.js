import fetch from 'node-fetch'

let handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(`📌 Ejemplo: .${command} My Melody`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) {
      return m.reply('❌ No se encontraron stickers.')
    }

    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    const downloadRes = await fetch(`https://delirius-apiofc.vercel.app/download/stickerly?url=${encodeURIComponent(pick.url)}`)
    const downloadJson = await downloadRes.json()

    if (!downloadJson.status || !downloadJson.data) return m.reply('⚠️ Error al obtener el pack.')

    const { stickers, name, author } = downloadJson.data

    await conn.sendMessage(m.chat, {
      document: { url: stickers[0] },
      mimetype: 'image/webp',
      fileName: `${name}.wastickers`,
      caption: `📦 *Pack:* ${name}\n👤 *Autor:* ${author}`,
      contextInfo: {
        externalAdReply: {
          showAdAttribution: true,
          title: name,
          body: author,
          mediaType: 1,
          thumbnailUrl: stickers[0],
          sourceUrl: pick.url
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al procesar el paquete.')
  }
}

handler.command = /^sly$/i

export default handler
