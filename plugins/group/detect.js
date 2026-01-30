import { WAMessageStubType } from '@whiskeysockets/baileys'

export async function before(m, { conn, participants }) {
    if (!m.messageStubType || !m.chat.endsWith('@g.us')) return true

    const chat = global.db.data.chats[m.chat]
    if (!chat) return true

    const st = m.messageStubType
    const param = m.messageStubParameters || []
    const who = param[0] || m.sender
    const userTag = `@${who.split('@')[0]}`

    if (chat.welcome && (st === 27 || st === 31 || st === WAMessageStubType.GROUP_PARTICIPANT_ADD)) {
        const groupMetadata = await conn.groupMetadata(m.chat).catch(_ => ({}))
        const baseTxt = `┏━━━〔 *ᴡᴇʟᴄᴏᴍᴇ* 〕━━━┓\n┃ ✎ ʜᴏʟᴀ: @user\n┃ ✎ ɢʀᴜᴘᴏ: @grupo\n┃ ✎ ɴᴏᴅᴏs: @total\n┗━━━━━━━━━━━━━━━━━━┛`
        const customPart = chat.customWelcome ? `\n\n➠ ${chat.customWelcome}` : ''
        const txt = (baseTxt + customPart)
            .replace(/@user/g, userTag)
            .replace(/@grupo/g, groupMetadata.subject || 'Sistema')
            .replace(/@total/g, participants.length)

        let pp = global.img
        try { pp = await conn.profilePictureUrl(who, 'image') } catch (e) {}

        await conn.sendMessage(m.chat, { image: { url: pp }, caption: txt, mentions: [who] })
        return true
    }

    if (chat.detect) {
        let tipo = '', icon = '🛡️', mensaje = '', thumb = global.img
        if (st === 29 || st === WAMessageStubType.GROUP_PROMOTE_ADMIN) {
            tipo = 'ᴀsᴄᴇɴsᴏ'; icon = '⚡'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀ`
        } else if (st === 30 || st === WAMessageStubType.GROUP_DEMOTE_ADMIN) {
            tipo = 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ'; icon = '❌'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ`
        } else if (st === 21 || st === WAMessageStubType.GROUP_CHANGE_SUBJECT) {
            tipo = 'ɴᴏᴍʙʀᴇ'; icon = '📝'
            mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${param[0]}`
        } else if (st === 22 || st === WAMessageStubType.GROUP_CHANGE_ICON) {
            tipo = 'ɪᴄᴏɴᴏ'; icon = '🖼️'
            mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ`
            try { thumb = await conn.profilePictureUrl(m.chat, 'image') } catch (e) {}
        } else if (st === 23 || st === WAMessageStubType.GROUP_CHANGE_INVITE_LINK) {
            tipo = 'ᴇɴʟᴀᴄᴇ'; icon = '🔗'
            mensaje = `> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴇɴʟᴀᴄᴇ ʀᴇsᴛABLECIDO`
        } else if (st === 24 || st === WAMessageStubType.GROUP_CHANGE_DESCRIPTION) {
            tipo = 'ɪɴғᴏ'; icon = '📜'
            mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴀ ᴅᴇsᴄʀɪᴘᴄɪᴏɴ`
        } else if (st === 25 || st === WAMessageStubType.GROUP_CHANGE_RESTRICT) {
            tipo = 'ᴘᴇʀᴍɪsᴏs'; icon = '⚙️'
            mensaje = `> ┃ ✎ ᴇᴅɪᴄɪᴏɴ: ${param[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'}`
        } else if (st === 26 || st === WAMessageStubType.GROUP_CHANGE_ANNOUNCE) {
            tipo = 'ᴄʜᴀᴛ'; icon = '🔒'
            mensaje = `> ┃ ✎ ᴇsᴛᴀᴅᴏ: ${param[0] === 'on' ? 'ᴄᴇʀʀᴀᴅᴏ' : 'ᴀʙɪᴇʀᴛᴏ'}`
        } else if (st === 28 || st === WAMessageStubType.GROUP_PARTICIPANT_LEAVE) {
            tipo = 'sᴀʟɪᴅᴀ'; icon = '👋'
            mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${userTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴀʙᴀɴᴅᴏɴᴏ ᴇʟ ɢʀᴜᴘᴏ`
        } else if (st === 32 || st === WAMessageStubType.BIZ_PRIVACY_MODE_INITIATED) {
            tipo = 'ᴇғɪᴍᴇʀᴏ'; icon = '⏳'
            mensaje = `> ┃ ✎ ᴛɪᴇᴍᴘᴏ: ${param[0] === '0' ? 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ' : param[0]}`
        } else { return true }

        await conn.sendMessage(m.chat, {
            text: `> ┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n> ┗━━━━━━━━━━━━━━━━━━┛\n\n> 📅 _${global.fecha || new Date().toLocaleDateString()}_`,
            contextInfo: {
                mentionedJid: [who],
                externalAdReply: {
                    title: `ʟᴏɢ: ${tipo}`,
                    body: icon,
                    mediaType: 1,
                    thumbnailUrl: thumb,
                    sourceUrl: '',
                    renderLargerThumbnail: false
                }
            }
        })
    }
    return true
}
