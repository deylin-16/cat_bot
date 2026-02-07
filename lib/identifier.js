import { jidNormalizedUser } from '@whiskeysockets/baileys'

export async function getRealJid(conn, jid, m) {
    let target = jid || (m?.key?.participant || m?.key?.remoteJid || m?.participant || conn.user.id)
    
    if (!target.endsWith('@lid')) return jidNormalizedUser(target)

    if (m?.key?.remoteJid?.endsWith('@g.us') || m?.chat?.endsWith('@g.us')) {
        try {
            const chatId = m?.key?.remoteJid || m?.chat
            const metadata = await conn.groupMetadata(chatId)
            const participant = (metadata.participants || []).find(p => p.id === target)
            
            if (participant?.phoneNumber) {
                let number = participant.phoneNumber
                return jidNormalizedUser(number.includes('@') ? number : `${number}@s.whatsapp.net`)
            }
        } catch (e) {
            return jidNormalizedUser(target)
        }
    }
    return jidNormalizedUser(target)
}

export async function resolveMentions(conn, mentions, m) {
    if (!mentions || !mentions.length) return []
    return Promise.all(mentions.map(jid => getRealJid(conn, jid, m)))
}

export function cleanNumber(jid) {
    return jid.replace(/\D/g, '')
}
