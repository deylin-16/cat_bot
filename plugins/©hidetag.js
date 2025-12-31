import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import * as fs from 'fs'
import fetch from 'node-fetch'

var handler = async (m, { conn, text, participants, isOwner, isAdmin }) => {

    let users = participants.map(u => conn.decodeJid(u.id))

    
    let tagText = text ? text : (m.quoted && m.quoted.text ? m.quoted.text : "")

    if (!tagText && !m.quoted) return m.reply('*Escribe un mensaje para etiquetar a todos.*')

    let finalCaption = tagText.trim()

    let quoted = m.quoted ? m.quoted : m
    let mime = (quoted.msg || quoted).mimetype || ''
    let isMedia = /image|video|sticker|audio/.test(mime)

    if (isMedia) {
        try {
            let media = await quoted.download?.()
            let messageContent = {}

            if (quoted.mtype === 'imageMessage') {
                messageContent = { image: media, caption: finalCaption, mentions: users }
            } else if (quoted.mtype === 'videoMessage') {
                messageContent = { video: media, caption: finalCaption, mentions: users, mimetype: 'video/mp4' }
            } else if (quoted.mtype === 'audioMessage') {
                messageContent = { audio: media, fileName: 'Hidetag.mp3', mimetype: 'audio/mp4', mentions: users }
            } else if (quoted.mtype === 'stickerMessage') {
                messageContent = { sticker: media, mentions: users }
            }

            await conn.sendMessage(m.chat, messageContent, { quoted: m })

        } catch (e) {
            
            await conn.sendMessage(
                m.chat,
                { text: finalCaption, mentions: users },
                { quoted: m }
            )
        }

    } else {
        
        await conn.sendMessage(
            m.chat, 
            { text: finalCaption, mentions: users }, 
            { quoted: m }
        )
    }
}

handler.command = ['tag', 'n']
handler.group = true
handler.admin = true

export default handler
