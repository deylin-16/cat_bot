import { WAMessageStubType } from '@whiskeysockets/baileys'

export async function before(m, { conn, participants, groupMetadata }) {

    if (!m.messageStubType || !m.isGroup) return true

    const botSettings = global.db.data.settings[conn.user.jid] || {}
    const mainBotJid = global.conn?.user?.jid
    const currentBotJid = conn.user.jid

    if (currentBotJid === mainBotJid && botSettings.soloParaJid) return true

    const chat = global.db.data.chats[m.chat]
    if (!chat?.welcome) return true

    const isAdd = m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD || m.messageStubType === WAMessageStubType.GROUP_CHANGE_MEMBERS
    if (!isAdd) return true

    const who = m.messageStubParameters?.[0]
    if (!who) return true

    const totalMembers = participants.length
    const nombreDelGrupo = groupMetadata.subject
    const mentionListText = `@${who.split('@')[0]}`

    let ppUrl = 'https://i.ibb.co/jPSF32Pz/9005bfa156f1f56fb2ac661101d748a5.jpg'
    try {
        const assistantImg = global.getAssistantConfig(conn.user.jid).assistantImage
        ppUrl = assistantImg || await conn.profilePictureUrl(who, 'image')
    } catch {
        try {
            ppUrl = await conn.profilePictureUrl(m.chat, 'image')
        } catch {}
    }

    const welcomeText = chat.customWelcome || `bienvenido @user a @grupo somos @total\n\n> Un administrador puede editar esta bienvenida con el comando \`setwelcome\``

    let finalCaption = welcomeText
        .replace(/\\n/g, '\n')
        .replace(/@user/g, mentionListText)
        .replace(/@grupo/g, nombreDelGrupo)
        .replace(/@total/g, totalMembers)

    let fkontak = {
        key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
        message: { 
            contactMessage: { 
                displayName: `BIENVENID@ A ${nombreDelGrupo}`, 
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Admin;;;\nFN:Admin\nEND:VCARD` 
            } 
        }
    }

    try {
        await conn.sendMessage(m.chat, {
            image: typeof ppUrl === 'string' ? { url: ppUrl } : ppUrl,
            caption: finalCaption.trim(),
            mentions: [who]
        }, { quoted: fkontak })
    } catch (e) {
        console.error('Error al enviar bienvenida:', e)
    }

    return true
}
