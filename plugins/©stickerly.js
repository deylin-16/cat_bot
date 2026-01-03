import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`✨ Escribe un término para buscar packs en Sticker.ly`)

  try {
    const searchRes = await fetch(`https://delirius-apiofc.vercel.app/search/stickerly?query=${encodeURIComponent(text)}`)
    const searchJson = await searchRes.json()

    if (!searchJson.status || !searchJson.data?.length) return m.reply('❌ No se encontraron paquetes.')

    // Elegimos un pack aleatorio de los resultados
    const pick = searchJson.data[Math.floor(Math.random() * searchJson.data.length)]
    
    // El secreto está en enviar el enlace directo de Sticker.ly. 
    // WhatsApp genera automáticamente la tarjeta verde que viste en la captura.
    const packUrl = pick.url 

    await conn.sendMessage(m.chat, {
      text: packUrl,
      contextInfo: {
        externalAdReply: {
          title: pick.name || 'Pack de Stickers',
          body: `Autor: ${pick.author || 'Sticker.ly'}`,
          sourceUrl: packUrl,
          mediaType: 1,
          showAdAttribution: false,
          renderLargerThumbnail: false,
          thumbnailUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/dd/93/2d/dd932d94-386b-640a-313b-8575048d087b/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.jpg'
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un error al generar la vista previa del paquete.')
  }
}

handler.command = ['stikerly', 'sly']

export default handler
