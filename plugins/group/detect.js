import { WAMessageStubType } from '@whiskeysockets/baileys'
import { getRealJid } from '../lib/identifier.js'

export async function before(m, { conn, participants }) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return true

    const chat = global.db.data.chats[m.chat]
    if (!chat) return true

    const st = m.messageStubType
    const param = m.messageStubParameters || []
   
    let rawWho = param[0] || m.sender
    let who = await getRealJid(conn, rawWho, m)
    const userTag = `@${who.split('@')[0]}`

    const isWelcome = [27, 31, WAMessageStubType.GROUP_PARTICIPANT_ADD].includes(st)
    if (chat.welcome && isWelcome) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        const baseTxt = `┏━━━〔 *ᴡᴇʟᴄᴏᴍᴇ* 〕━━━┓\n┃ ✎ ʜᴏʟᴀ: @user\n┃ ✎ ɢʀᴜᴘᴏ: @grupo\n┃ ✎ ɴᴏᴅᴏs: @total\n┗━━━━━━━━━━━━━━━━━━┛`
        const customPart = chat.customWelcome ? `\n\n➠ ${chat.customWelcome}` : ''
        const txt = (baseTxt + customPart)
            .replace(/@user/g, userTag)
            .replace(/@grupo/g, groupMetadata.subject || 'Sistema')
            .replace(/@total/g, participants.length)

        let pp = 'https://telegra.ph/file/243e966f050255dbd2d56.jpg' 
        try { pp = await conn.profilePictureUrl(who, 'image') } catch (e) {}

        await conn.sendMessage(m.chat, { image: { url: pp }, caption: txt, mentions: [who] })
        return true
    }

    // 2. LÓGICA DE DETECCIÓN (Cambios en el grupo)
    if (chat.detect) {
        let tipo = '', icon = '🛡️', mensaje = '', thumb = 'https://telegra.ph/file/243e966f050255dbd2d56.jpg'
        
        const events = {
            [WAMessageStubType.GROUP_PROMOTE_ADMIN]: { t: 'ᴀsᴄᴇɴsᴏ', i: '⚡', m: `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀ` },
            [WAMessageStubType.GROUP_DEMOTE_ADMIN]: { t: 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ', i: '❌', m: `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ` },
            [WAMessageStubType.GROUP_CHANGE_SUBJECT]: { t: 'ɴᴏᴍʙʀᴇ', i: '📝', m: `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${param[0]}` },
            [WAMessageStubType.GROUP_CHANGE_ICON]: { t: 'ɪᴄᴏɴᴏ', i: '🖼️', m: `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ` },
            [WAMessageStubType.GROUP_CHANGE_INVITE_LINK]: { t: 'ᴇɴʟᴀᴄᴇ', i: '🔗', m: `> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴇɴʟᴀᴄᴇ ʀᴇsᴛABLECIDO` },
            [WAMessageStubType.GROUP_CHANGE_DESCRIPTION]: { t: 'ɪɴғᴏ', i: '📜', m: `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴀ ᴅᴇsᴄʀɪᴘᴄɪᴏɴ` },
            [WAMessageStubType.GROUP_PARTICIPANT_LEAVE]: { t: 'sᴀʟɪᴅᴀ', i: '👋', m: `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: sᴇ ʜᴀ ɪᴅᴏ ᴅᴇʟ ɢʀᴜᴘᴏ` }
        }

        const ev = events[st]
        if (ev) {
            tipo = ev.t; icon = ev.i; mensaje = ev.m
            if (st === WAMessageStubType.GROUP_CHANGE_ICON) {
                try { thumb = await conn.profilePictureUrl(m.chat, 'image') } catch (e) {}
            }

            await conn.sendMessage(m.chat, {
                text: `> ┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
                contextInfo: {
                    mentionedJid: [who],
                    externalAdReply: {
                        title: `ʟᴏɢ: ${tipo}`,
                        body: icon,
                        mediaType: 1,
                        thumbnailUrl: thumb,
                        renderLargerThumbnail: false
                    }
                }
            })
        }
    }
    return true
}
