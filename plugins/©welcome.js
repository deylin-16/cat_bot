import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

export async function before(m, { conn, participants, groupMetadata }) {
    let botSettings = global.db.data.settings[conn.user.jid] || {}
    if (botSettings.soloParaJid) return
    if (!m.messageStubType || !m.isGroup) return true

    const totalMembers = participants.length
    const who = m.messageStubParameters?.[0]
    
    if (!who) {
        
        return
    }

    if (m.messageStubType !== WAMessageStubType.GROUP_PARTICIPANT_ADD && m.messageStubType !== WAMessageStubType.GROUP_CHANGE_MEMBERS) {
        return
    }

    const chat = global.db.data.chats[m.chat]
    if (!chat?.welcome || !chat?.customWelcome) return

    const user = participants.find(p => p.jid === who)
    const userName = user?.notify || who.split('@')[0]
    const mentionListText = `@${who.split('@')[0]}`

    let ppUrl
    const defaultPp = 'https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg'

    try {
        ppUrl = await conn.profilePictureUrl(who, 'image')
    } catch {
        ppUrl = defaultPp
    }

    const welcomeText = chat.customWelcome
    const nombreDelGrupo = groupMetadata.subject
    
    let finalCaption = welcomeText
        .replace(/\\n/g, '\n')
        .replace(/@user/g, mentionListText)
        .replace(/@grupo/g, nombreDelGrupo)
        .replace(/@total/g, totalMembers)

    let fkontak

    try {
        fkontak = {
            key: { fromMe: false, participant: "0@s.whatsapp.net" },
            message: { locationMessage: { name: `BIENVENID@ A _ ${nombreDelGrupo}`} }
        }
    } catch (e) {
        
    }

    const jid = m.chat

    const mentionId = who ? [who] : []

    const imageMessage = {
        image: { url: ppUrl }, 
        caption: finalCaption.trim(), 
        contextInfo: { 
            mentionedJid: mentionId, 
        }
    }


    await conn.sendMessage(jid, imageMessage, {
        quoted: fkontak 
    })
}
