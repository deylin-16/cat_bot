import fetch from 'node-fetch'

const handler = async (m, { conn, participants, text }) => {
  let chat = global.db.data.chats[m.chat]
  let emojiIcon = chat?.emojiTag || '⟆⟆'

  await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

  const fixedImage = 'https://files.catbox.moe/oxpead.jpg'
  const thumb = await (await fetch(fixedImage)).buffer()

  const botJid = conn.user.jid.split(':')[0] + '@s.whatsapp.net'
  const validParticipants = participants.filter(p => !p.id.includes('lid') && (p.id.split(':')[0] + '@s.whatsapp.net') !== botJid)
  const cleanNumbers = validParticipants.map(p => p.id.split('@')[0])

  let infoPaises = []
  let apiErrorInfo = null

  if (cleanNumbers.length > 0) {
    try {
      const url = `https://deylin.xyz/api/numberinfo?numeros=${cleanNumbers.join(',')}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        apiErrorInfo = `Error HTTP: ${response.status}`
      } else {
        const data = await response.json()
        // Validamos que data sea un array, si no, lo convertimos
        infoPaises = Array.isArray(data) ? data : [data]
      }
    } catch (e) {
      apiErrorInfo = `Error de Red: ${e.message}`
    }
  }

  const fkontak = {
    key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'ULTRA-BOT' },
    message: { locationMessage: { name: 'DEYLIN API SYSTEM', jpegThumbnail: thumb } }
  }

  let motivo = text || 'Sin motivo.'
  let teks = `*!  MENCION GENERAL  !*\n*Motivo:* ${motivo}\n\n`
  
  // Si tenemos info de la API, la usamos. Si no, usamos respaldo.
  if (infoPaises.length > 0 && infoPaises[0].numero) {
    teks += infoPaises.map(v => {
      const bandera = v.bandera || '🔊'
      return `${bandera} ${emojiIcon} @${v.numero}`
    }).join('\n')
  } else {
    if (apiErrorInfo) teks += `⚠️ *Debug:* ${apiErrorInfo}\n\n`
    teks += cleanNumbers.map(num => `🔊 ${emojiIcon} @${num}`).join('\n')
  }

  await conn.sendMessage(
    m.chat,
    {
      text: teks,
      mentions: validParticipants.map(p => p.id),
      contextInfo: { 
        mentionedJid: validParticipants.map(p => p.id),
        externalAdReply: {
          title: 'DEYLIN API SYSTEM',
          body: `Mencionando a ${validParticipants.length} miembros`,
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
