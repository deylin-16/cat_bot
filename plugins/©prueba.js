import fetch from 'node-fetch'

const handler = async (m, { conn, participants, text }) => {
  let chat = global.db.data.chats[m.chat]
  let emojiIcon = chat?.emojiTag || '⟆⟆'

  await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } })

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
      const response = await fetch(url)

      if (!response.ok) {
        apiErrorInfo = `Error HTTP: ${response.status} - ${response.statusText}`
      } else {
        const data = await response.json()
        infoPaises = Array.isArray(data) ? data : (data.numero ? [data] : [])
      }
    } catch (e) {
      apiErrorInfo = `Fallo de conexión: ${e.message}`
    }
  }

  const fkontak = {
    key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'ULTRA-BOT' },
    message: { locationMessage: { name: 'DEBUG SYSTEM', jpegThumbnail: thumb } }
  }

  let motivo = text || 'Sin motivo.'
  let teks = `*!  MENCION GENERAL  !*\n*Motivo:* ${motivo}\n\n`
  
  if (apiErrorInfo) {
    teks += `⚠️ *ERROR DE API:* ${apiErrorInfo}\n_Usando modo de respaldo..._\n\n`
    teks += cleanNumbers.map(num => `🔊 ${emojiIcon} @${num}`).join('\n')
  } else if (infoPaises.length === 0) {
    teks += `❓ *INFO:* No se recibieron datos de la API.\n\n`
    teks += cleanNumbers.map(num => `🔊 ${emojiIcon} @${num}`).join('\n')
  } else {
    teks += infoPaises.map(v => {
      const bandera = (v.bandera && v.bandera !== '🏴') ? v.bandera : '🔊'
      return `${bandera} ${emojiIcon} @${v.numero}`
    }).join('\n')
  }

  await conn.sendMessage(
    m.chat,
    {
      text: teks,
      mentions: validParticipants.map(p => p.id),
      contextInfo: { 
        mentionedJid: validParticipants.map(p => p.id),
        externalAdReply: {
          title: 'DEYLIN DEBUG SYSTEM',
          body: apiErrorInfo ? 'ALERTA: API CON ERRORES' : `Mencionando a ${validParticipants.length} miembros`,
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
