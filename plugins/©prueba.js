import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

export async function before(m, { conn, participants, groupMetadata }) {
    let botSettings = global.db.data.settings[conn.user.jid] || {}
    if (botSettings.soloParaJid) return
    if (!m.messageStubType || !m.isGroup) return true

    const totalMembers = participants.length
    const who = m.messageStubParameters?.[0]
    if (!who) return

    if (m.messageStubType !== WAMessageStubType.GROUP_PARTICIPANT_ADD) return

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

    let finalCaption = welcomeText.replace(/\\n/g, '\n').replace(/@user/g, mentionListText)


    finalCaption = `\n${finalCaption}` 

    const jid = m.chat

    const productMessage = {
        product: {
            productImage: { url: ppUrl },
            productId: '2452968910',
            title: `¡BIENVENIDO! Ahora somos ${totalMembers} miembros`,
            description: `Grupo: ${groupMetadata.subject}`,
            currencyCode: 'USD',
            priceAmount1000: '0',
            retailerId: 1677,
            url: `hola`,
            productImageCount: 1
        },
        businessOwnerJid: who || '0@s.whatsapp.net',

        caption: ${finalCaption}`.trim(), 
        title: 'gati',
        subtitle: '',

        footer: finalCaption.replace(/\n/g, ' ').slice(0, 10000000000000) + '.', 
        mentions: who ? [who] : []
    }

    const mentionId = who ? [who] : []
    await conn.sendMessage(jid, productMessage, {
        quoted: null,
        contextInfo: { mentionedJid: mentionId }
    })
}