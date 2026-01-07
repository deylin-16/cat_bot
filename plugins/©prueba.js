import fetch from 'node-fetch'

const handler = async (m, { conn, participants }) => {
  let chat = global.db.data.chats[m.chat]
  let emojiIcon = chat?.emojiTag || '⟆⟆'

  await conn.sendMessage(m.chat, { react: { text: '🔊', key: m.key } })

  const fixedImage = 'https://files.catbox.moe/oxpead.jpg'
  const thumb = await (await fetch(fixedImage)).buffer()

  const jids = participants
    .map(p => p.id.split('@')[0])
    .filter(id => id !== conn.user.jid.split('@')[0])

  let infoPaises = []
  try {
    const response = await fetch('https://deylin.xyz/api/numberinfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeros: jids })
    })
    infoPaises = await response.json()
  } catch {
    infoPaises = jids.map(id => ({ numero: id, bandera: '🔊', pais: 'Desconocido' }))
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

  let teks = `*!  MENCION GENERAL  !*\n*PARA ${participants.length} MIEMBROS* 🔊\n\n`
  let mentions = []

  for (const info of infoPaises) {
    const jid = `${info.numero}@s.whatsapp.net`
    mentions.push(jid)
    teks += `${info.bandera || '🔊'} ${emojiIcon} @${info.numero}\n`
  }

  await conn.sendMessage(
    m.chat,
    {
      text: teks,
      mentions,
      contextInfo: { 
        mentionedJid: mentions,
        externalAdReply: {
          title: 'INVOCACIÓN MASIVA',
          body: 'Deylin API System',
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
handler.customPrefix = /^\.?(todos|invocar|invocacion|invocación)$/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler
