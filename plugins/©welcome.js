import { WAMessageStubType } from '@whiskeysockets/baileys'

async function sendBatchedWelcome(conn, jid) {
    const batch = conn.welcomeBatch[jid]
    if (!batch || batch.users.length === 0) return

    clearTimeout(batch.timer)

    const users = batch.users
    const groupMetadata = (await conn.groupMetadata(jid).catch(() => ({}))) || {}
    const chat = global.db?.data?.chats?.[jid] || {}

    // Intentar obtener la URL de la imagen del grupo
    let ppGroup = null
    try {
        ppGroup = await conn.profilePictureUrl(jid, 'image')
    } catch (e) {
        // Si falla (no hay foto), ppGroup permanece null
    }

    const mentionListText = users.map(jid => `@${jid.split("@")[0]}`).join(', ')

    let welcomeText = chat.customWelcome || "bienvenido al grupo @user"

    // Asegurar el respeto de los saltos de línea
    welcomeText = welcomeText.replace(/\\n/g, '\n')

    let finalCaption = welcomeText.replace(/@user/g, mentionListText) 

    try {
        const messageOptions = {
            mentions: users
        }

        if (ppGroup) {
            // Si hay URL, enviar como imagen con caption
            messageOptions.image = { url: ppGroup }
            messageOptions.caption = finalCaption
        } else {
            // Si no hay URL, enviar solo texto
            messageOptions.text = finalCaption
        }

        await conn.sendMessage(jid, messageOptions)

    } catch (e) {
        console.error("ERROR AL ENVIAR BIENVENIDA (VERIFICAR PERMISOS DEL BOT O FALLA DE CONEXIÓN):", e)
    }

    delete conn.welcomeBatch[jid]
}


export async function before(m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return
    const who = m.messageStubParameters?.[0]
    if (!who) return

    const chat = global.db?.data?.chats?.[m.chat] || {}

    // La bienvenida está activa por defecto (a menos que se desactive explícitamente a 'false')
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD && chat.welcome !== false) {

        conn.welcomeBatch = conn.welcomeBatch || {}
        const jid = m.chat

        if (!conn.welcomeBatch[jid]) {
            conn.welcomeBatch[jid] = { users: [], timer: null }
        }

        if (conn.welcomeBatch[jid].timer) {
            clearTimeout(conn.welcomeBatch[jid].timer)
        }

        if (!conn.welcomeBatch[jid].users.includes(who)) {
            conn.welcomeBatch[jid].users.push(who)
        }

        conn.welcomeBatch[jid].timer = setTimeout(() => {
            sendBatchedWelcome(conn, jid)
        }, 5000)

    }
}
