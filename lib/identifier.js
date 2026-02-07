import { jidNormalizedUser } from '@whiskeysockets/baileys'

export async function getRealJid(conn, m) {
    let rawSender = m.key.participant || m.key.remoteJid || m.participant || conn.user.id
    
    if (!rawSender.endsWith('@lid')) {
        return jidNormalizedUser(rawSender)
    }

    if (m.key.remoteJid.endsWith('@g.us')) {
        try {
            const metadata = await conn.groupMetadata(m.key.remoteJid)
            const participant = (metadata.participants || []).find(p => p.id === rawSender)
            
            if (participant?.phoneNumber) {
                let number = participant.phoneNumber
                return jidNormalizedUser(number.includes('@') ? number : `${number}@s.whatsapp.net`)
            }
        } catch (e) {
            console.error('Error resolviendo LID en grupo:', e)
        }
    }

    return jidNormalizedUser(rawSender)
}

export function cleanNumber(jid) {
    return jid.replace(/\D/g, '')
}
