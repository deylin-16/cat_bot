import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { webp2png } from '../lib/webp2mp4.js'

let handler = async (m, { conn, args }) => {
  let stiker = false
  let userId = m.sender
  let packstickers = global.db.data.users[userId] || {}
  let texto1 = `BOT: ${name(conn)}`
  let texto2 = `USER: ${m.pushName}`
  
  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    let txt = args.join(' ')
    
    if (/webp|image|video/g.test(mime)) {
      if (/video/.test(mime) && (q.msg || q).seconds > 16) 
        return conn.reply(m.chat, '🍪 El video no puede durar más de *15 segundos*', m)
      
      let buffer = await q.download()
      if (!buffer) return m.reply('❌ No se pudo descargar el archivo.')
      
      await m.react('🕓')
      let marca = txt ? txt.split(/[\u2022|]/).map(part => part.trim()) : [texto1, texto2]

      try {
        
        
        stiker = await sticker(buffer, false, marca[0], marca[1])
      } catch (err) {
        console.error('Error en sticker directo:', err)
        
        let out = /video/.test(mime) ? await uploadFile(buffer) : await uploadImage(buffer)
        stiker = await sticker(false, out, marca[0], marca[1])
      }

    } else if (args[0] && isUrl(args[0])) {
      stiker = await sticker(false, args[0], texto1, texto2)
    } else {
      return conn.reply(m.chat, '🫧 Por favor, envía una *imagen* o *video* para hacer un sticker.', m)
    }
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '⚠︎ Ocurrió un Error: ' + e.message, m)
    await m.react('✖️')
  } finally {
    if (stiker) {
      await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
      await m.react('✅')
    }
  }
}

handler.command = ['s', 'sticker']
export default handler

function isUrl(text) {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(jpe?g|gif|png|webp)/, 'gi'))
}
