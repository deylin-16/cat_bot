import fetch from 'node-fetch'

const handler = async (m, { conn, participants, text, command }) => {
  let chat = global.db.data.chats[m.chat]
  let emojiIcon = chat?.emojiTag || '⟆⟆'

  await conn.sendMessage(m.chat, { react: { text: '🔊', key: m.key } })

  const fixedImage = 'https://files.catbox.moe/oxpead.jpg'
  const thumb = await (await fetch(fixedImage)).buffer()

  const validParticipants = participants.filter(p => !p.id.includes('lid'))
  const cleanNumbers = validParticipants.map(p => p.id.split('@')[0])

  let infoPaises = []
  try {
    const response = await fetch(`https://deylin.xyz/api/numberinfo?numeros=${cleanNumbers.join(',')}`)
    infoPaises = await response.json()
  } catch {
    infoPaises = cleanNumbers.map(num => ({ numero: num, bandera: '🔊' }))
  }

  const fkontak = {
    key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'ULTRA-BOT' },
    message: {
      locationMessage: {
        name: 'INVOCACIÓN GENERAL',
        jpegThumbnail: thumb
      }
    }
  }

  let motivo = text || 'Sin motivo.'
  let teks = `*!  MENCION GENERAL  !*\n*Motivo:* ${motivo}\n\n`
  
  let mentions = validParticipants.map(p => p.id)
  
  teks += infoPaises.map(v => {
    const bandera = (v.bandera && v.bandera !== '🏴') ? v.bandera : '🔊'
    return `${bandera} ${emojiIcon} @${v.numero}`
  }).join('\n')

  await conn.sendMessage(
    m.chat,
    {
      text: teks,
      mentions,
      contextInfo: { 
        mentionedJid: mentions,
        externalAdReply: {
          title: 'DEYLIN API SYSTEM',
          body: `Mencionando a ${mentions.length} miembros`,
          thumbnail: thumb,
          sourceUrl: 'https://deylin.xyz',
          mediaType: 1,
          showAdAttribution: true
        }
      }
    },
    { quoted: fkontak }
  )
}

handler.help = ['todos']
handler.tags = ['grupos']
handler.command = /^\.?(todos|invocar|invocacion|invocación|tagall|anuncio)$/i
handler.group = true
handler.admin = true

export default handler
