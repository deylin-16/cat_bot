/* eslint-disable */
let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
let linkRegex1 = /whatsapp.com\/channel\/([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  if (!m.isGroup || !m.chat.endsWith('@g.us')) return 

  let chat = global.db.data.chats[m.chat]
  let user = global.db.data.users[m.sender]

  if (!chat?.antiLink) return
  if (isAdmin || isOwner || m.fromMe || isROwner) return

  const isGroupLink = linkRegex.exec(m.text) || linkRegex1.exec(m.text)
  const isChannelLink = m?.msg?.contextInfo?.forwardedNewsletterMessageInfo

  if (isChannelLink || isGroupLink) {
    if (isGroupLink && isBotAdmin) {
      const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat).catch(_ => '')}`
      if (m.text.includes(linkThisGroup)) return !0
    }

    user.warnAntiLink = (user.warnAntiLink || 0) + 1
    const maxWarnings = 3
    const mentionUser = `@${m.sender.split`@`[0]}`

    try {
      if (isBotAdmin) {
        await conn.sendMessage(m.chat, { delete: m.key })

        if (user.warnAntiLink < maxWarnings) {
          await conn.sendMessage(m.chat, { 
            text: `┏━━━〔 ᴀɴᴛɪʟɪɴᴋ ᴅᴇᴛᴇᴄᴛ 〕━━━┓
┃ ✎ ᴜsᴇʀ: ${mentionUser}
┃ ✎ sᴛᴀᴛᴜs: ᴡᴀʀɴɪɴɢ [${user.warnAntiLink}/${maxWarnings}]
┃ ✎ ɪɴғᴏ: ᴇʟ ᴇɴᴠɪᴏ ᴅᴇ ᴇɴʟᴀᴄᴇs ᴇsᴛᴀ ʀᴇsᴛʀɪɴɢɪᴅᴏ.
┗━━━━━━━━━━━━━━━━━━┛`, 
            mentions: [m.sender] 
          }, { quoted: null })
        } else {
          await conn.sendMessage(m.chat, { 
            text: `┏━━━〔 ᴇxᴛᴇʀᴍɪɴᴀᴛᴇ 〕━━━┓
┃ ✎ ᴜsᴇʀ: ${mentionUser}
┃ ✎ ʀᴇᴀsᴏɴ: ʟɪᴍɪᴛ ᴏғ ᴡᴀʀɴɪɴɢs ʀᴇᴀᴄʜᴇᴅ.
┃ ✎ ᴀᴄᴛɪᴏɴ: ʀᴇᴍᴏᴠɪɴɢ...
┗━━━━━━━━━━━━━━━━━━┛`, 
            mentions: [m.sender] 
          }, { quoted: null })

          user.warnAntiLink = 0
          await delay(1500)
          await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        }
      } else {
        await conn.sendMessage(m.chat, { 
          text: `┏━━━〔 sʏsᴛᴇᴍ ᴀʟᴇʀᴛ 〕━━━┓
┃ ✎ ᴜsᴇʀ: ${mentionUser}
┃ ✎ ɪɴғᴏ: ᴇɴʟᴀᴄᴇ ᴅᴇᴛᴇᴄᴛᴀᴅᴏ.
┃ ✎ sᴛᴀᴛᴜs: ɴᴏ ᴀᴅᴍɪɴ ᴘᴇʀᴍɪssɪᴏɴs.
┗━━━━━━━━━━━━━━━━━━┛`,
          mentions: [m.sender] 
        })
      }
    } catch (e) {
      console.error(e)
    }
    return !0
  }
  return !0
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
