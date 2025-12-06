import { WAMessageStubType } from '@whiskeysockets/baileys'

async function sendBatchedWelcome(conn, jid) {
    const batch = conn.welcomeBatch[jid]
    if (!batch || batch.users.length === 0) return

    clearTimeout(batch.timer)

    const users = batch.users
    const chat = global.db?.data?.chats?.[jid] || {}

    // Intentar obtener la foto de perfil del grupo
    let ppGroup = null
    try {
        ppGroup = await conn.profilePictureUrl(jid, 'image')
    } catch (e) {
        // Si hay un error, ppGroup permanece null, lo cual es manejado más abajo.
    }

    const mentionListText = users.map(jid => `@${jid.split("@")[0]}`).join(', ')

    let welcomeText = chat.customWelcome || "bienvenido al grupo @user"

    welcomeText = welcomeText.replace(/\\n/g, '\n')
    
    let finalCaption = welcomeText.replace(/@user/g, mentionListText) 

    try {
        const messageOptions = {
            mentions: users
        }

        // CONTROL EXCLUSIVO DE IMAGEN/TEXTO:
        if (typeof ppGroup === 'string' && ppGroup.length > 0) {
            // Envía IMAGEN solo si ppGroup es una cadena de texto (URL) no vacía.
            messageOptions.image = { url: ppGroup }
            messageOptions.caption = finalCaption
        } else {
            // Envía solo TEXTO si no hay URL válida o ppGroup es null.
            messageOptions.text = finalCaption
        }

        await conn.sendMessage(jid, messageOptions)

    } catch (e) {
        console.error("ERROR AL ENVIAR BIENVENIDA (VERIFICAR PERMISOS DEL BOT O FALLA DE CONEXIÓN):", e)
    }

    delete conn.welcomeBatch[jid]
}


export async function before(m, { conn }) {
    if (!m.messageStubType || !m.isGroup) return
    const who = m.messageStubParameters?.[0]
    if (!who) return

    const chat = global.db?.data?.chats?.[m.chat] || {}

    // Incluye GROUP_PARTICIPANT_JOIN y GROUP_PARTICIPANT_ADD.
    const isWelcomeEvent = m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD || 
                           m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_JOIN;
                           
    if (isWelcomeEvent && chat.welcome !== false) {

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
