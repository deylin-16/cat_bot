/* eslint-disable */
let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
  if (!m.isGroup) return 

  if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
    
  let chat = global.db.data.chats[m.chat]
  let user = global.db.data.users[m.sender]

  if (!chat.antiLink) return

  if (isAdmin || isOwner || m.fromMe || isROwner) return

  const delet = m.key.participant
  const bang = m.key.id
  const mentionUser = `@${m.sender.split`@`[0]}`
  const groupAdmins = participants.filter(p => p.admin)
  const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text)
  const isChannelLink = m?.msg?.contextInfo?.forwardedNewsletterMessageInfo

  user.warnAntiLink = user.warnAntiLink || 0 

  if ((isChannelLink || isGroupLink) && !isAdmin) {
    
    if (isGroupLink && isBotAdmin) {
      const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`
      if (m.text.includes(linkThisGroup)) return !0
    }

    try {
      if (isBotAdmin) {

        await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet } })
        
        user.warnAntiLink += 1
        let currentWarnings = user.warnAntiLink
        const maxWarnings = 3

        if (currentWarnings < maxWarnings) {
          await conn.sendMessage(m.chat, { 
            text: `⚠️ *Advertencia Anti-Enlace* ⚠️
Bro ${mentionUser}, no envíes enlaces de otros grupos o canales. Está prohibido en este grupo.

Llevas ${currentWarnings}/${maxWarnings} advertencias. A la tercera, serás eliminado.`, 
            mentions: [m.sender] 
          }, { quoted: m })

        } else {
          await conn.sendMessage(m.chat, { 
            text: `⛔ *EXPULSIÓN POR REINCIDENCIA* ⛔
Lo siento ${mentionUser}, acumulaste ${maxWarnings} advertencias por enviar enlaces. ¡Debo eliminarte del grupo!`, 
            mentions: [m.sender] 
          }, { quoted: m })

          user.warnAntiLink = 0
          await delay(2000)
          await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        }

      } else {
        await conn.sendMessage(m.chat, { 
          text: `🚨 ¡ALERTA DE ENLACE! 🚨
Hey ${mentionUser}, no envíes enlaces de grupos o canales. Está prohibido.

El bot no es administrador, pero un admin podría verte y eliminarte del grupo. ¡Ten cuidado!`,
          mentions: [m.sender] 
        }, { quoted: m })
      }

    } catch (e) {
      if (e?.data === 429) {
        console.log('⚠️ Rate limit detectado, esperando 10s...')
        await delay(10000)
      } else {
        console.error('❌ Error en antilink con advertencias:', e.message)
      }
    }
    return !0
  }

  return !0
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
