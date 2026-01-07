import fetch from 'node-fetch'

const handler = async (m, { conn, participants }) => {
  let chat = global.db.data.chats[m.chat]
  let emojiIcon = chat?.emojiTag || '⟆⟆'

  await conn.sendMessage(m.chat, { react: { text: '🔊', key: m.key } })

  const fixedImage = 'https://files.catbox.moe/oxpead.jpg'
  const thumb = await (await fetch(fixedImage)).buffer()

  const cleanNumbers = participants
    .map(p => p.id.split('@')[0].replace(/\D/g, '')) 
    .filter(id => id !== conn.user.jid.split('@')[0].replace(/\D/g, ''))

  let infoPaises = []
  try {
    const numerosQuery = cleanNumbers.join(',')
    const response = await fetch(`https://deylin.xyz/api/numberinfo?numeros=${numerosQuery}`)
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

  let teks = `*!  MENCION GENERAL  !*\n*PARA ${participants.length} MIEMBROS* 🔊\n\n`
  let mentions = []

  for (const info of infoPaises) {
    const rawNumber = info.numero
    const jid = `${rawNumber}@s.whatsapp.net`
    mentions.push(jid)

    const bandera = (info.bandera && info.bandera !== '🏴') ? info.bandera : '🔊'
    teks += `${bandera} ${emojiIcon} @${rawNumber}\n`
  }

  await conn.sendMessage(
    m.chat,
    {
      text: teks,
      mentions,
      contextInfo: { 
        mentionedJid: mentions,
        externalAdReply: {
          title: 'DEYLIN API SYSTEM',
          body: `Mencionando a ${participants.length} personas`,
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
