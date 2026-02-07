import { jidNormalizedUser, WAMessageStubType } from '@whiskeysockets/baileys'
import { getRealJid } from './identifier.js'

export async function events(conn, m, participants) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return true

    const chat = global.db.data.chats[m.chat]
    if (!chat) return true

    const st = m.messageStubType
    const params = m.messageStubParameters || []
    
    let authorRaw = m.sender || m.key.participant || m.participant
    let author = jidNormalizedUser(await getRealJid(conn, authorRaw, m))
    let authorTag = `@${author.split('@')[0]}`

    let whoJid = ''
    try {
        if (params[0] && params[0].startsWith('{')) {
            const parsed = JSON.parse(params[0])
            whoJid = parsed.phoneNumber || parsed.id || parsed.jid
        } else {
            whoJid = params[0] || author
        }
    } catch {
        whoJid = params[0] || author
    }

    let who = jidNormalizedUser(await getRealJid(conn, String(whoJid), m))
    let whoTag = `@${who.split('@')[0]}`

    let tipo = '', icon = '🛡️', mensaje = ''
    let thumb = 'https://telegra.ph/file/243e966f050255dbd2d56.jpg'
    let mentions = [author, who]
    let isWelcome = false

    switch (st) {
        case 27:
            isWelcome = true
            tipo = 'ᴇɴᴛʀᴀᴅᴀ'
            icon = '📥'
            mensaje = author === who 
                ? `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: sᴇ ᴜɴɪᴏ ᴀʟ ɢʀᴜᴘᴏ`
                : `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴀñᴀᴅɪᴅᴏ ᴘᴏʀ: ${authorTag}`
            break
        case 31:
            isWelcome = true
            tipo = 'ᴇɴᴛʀᴀᴅᴀ'
            icon = '🔗'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴠɪᴀ: ᴇɴʟᴀᴄᴇ ᴅᴇ ɪɴᴠɪᴛᴀᴄɪᴏɴ`
            break
        case 28:
            tipo = 'sᴀʟɪᴅᴀ'
            icon = '👞'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇʟɪᴍɪɴᴀᴅᴏ ᴘᴏʀ: ${authorTag}`
            break
        case 32:
            tipo = 'sᴀʟɪᴅᴀ'
            icon = '👋'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: sᴇ ʜᴀ ɪᴅᴏ ᴅᴇʟ ɢʀᴜᴘᴏ`
            break
        case 29:
            tipo = 'ᴀsᴄᴇɴsᴏ'
            icon = '⚡'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 30:
            tipo = 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ'
            icon = '❌'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 21:
            tipo = 'ɴᴏᴍʙʀᴇ'
            icon = '📝'
            mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${params[0]}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 22:
            tipo = 'ɪᴄᴏɴᴏ'
            icon = '🖼️'
            mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            try { thumb = await conn.profilePictureUrl(m.chat, 'image') } catch {} 
            break
        case 23:
            tipo = 'ᴇɴʟᴀᴄᴇ'
            icon = '🔗'
            mensaje = `> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴇɴʟᴀᴄᴇ ʀᴇsᴛᴀʙʟᴇᴄɪᴅᴏ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 25:
            tipo = 'ᴀᴊᴜsᴛᴇs'
            icon = '⚙️'
            mensaje = `> ┃ ✎ ᴇᴅɪᴄɪᴏɴ ᴅᴇ ɪɴғᴏ: ${params[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 26:
            tipo = 'ᴄʜᴀᴛ'
            icon = '💬'
            mensaje = `> ┃ ✎ ᴇɴᴠɪᴏ ᴅᴇ ᴍsɢs: ${params[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 145:
            tipo = 'ᴀᴘʀᴏʙᴀᴄɪᴏɴ'
            icon = '🛡️'
            mensaje = `> ┃ ✎ ᴍᴏᴅᴏ ᴅᴇ ɪɴɢʀᴇsᴏ: ${params[0]}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
        case 171:
            tipo = 'ᴍɪᴇᴍʙʀᴏs'
            icon = '👥'
            mensaje = `> ┃ ✎ ᴘᴇʀᴍɪsᴏ ᴀñᴀᴅɪʀ: ${params[0] === 'all_member_add' ? 'ᴛᴏᴅᴏs' : 'sᴏʟᴏ ᴀᴅᴍɪɴs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`
            break
    }

    if (!tipo) return true

    if (isWelcome && chat.welcome) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        const baseTxt = `┏━━━〔 *ᴡᴇʟᴄᴏᴍᴇ* 〕━━━┓\n┃ ✎ ʜᴏʟᴀ: @user\n┃ ✎ ɢʀᴜᴘᴏ: @grupo\n┃ ✎ ɴᴏᴅᴏs: @total\n┗━━━━━━━━━━━━━━━━━━┛`
        const txt = (baseTxt + (chat.customWelcome ? `\n\n➠ ${chat.customWelcome}` : ''))
            .replace(/@user/g, whoTag)
            .replace(/@grupo/g, groupMetadata.subject || 'Sistema')
            .replace(/@total/g, participants.length)

        try { thumb = await conn.profilePictureUrl(who, 'image') } catch {}

        await conn.sendMessage(m.chat, { 
            image: { url: thumb }, 
            caption: txt, 
            mentions: [who, author] 
        })
    } else if (chat.detect) {
        if (st !== 22) {
            try { thumb = await conn.profilePictureUrl(m.chat, 'image') } catch {}
        }

        await conn.sendMessage(m.chat, {
            text: `> ┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
            contextInfo: {
                mentionedJid: mentions,
                externalAdReply: {
                    title: `ꜱɪꜱᴛᴇᴍᴀ: ${tipo}`,
                    body: `Evento detectado: ${icon}`,
                    mediaType: 1,
                    thumbnailUrl: thumb,
                    renderLargerThumbnail: false
                }
            }
        })
    }
    return true
}
