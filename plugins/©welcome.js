import { WAMessageStubType } from '@whiskeysockets/baileys'

async function sendBatchedWelcome(conn, jid) {
    const batch = conn.welcomeBatch[jid]
    if (!batch || batch.users.length === 0) return

    clearTimeout(batch.timer)

    const users = batch.users
    const chat = global.db?.data?.chats?.[jid] || {}

    // Intenta obtener la foto de perfil del grupo
    let ppGroup = null
    try {
        ppGroup = await conn.profilePictureUrl(jid, 'image')
    } catch (e) {
        
    }

    const mentionListText = users.map(jid => `@${jid.split("@")[0]}`).join(', ')

    let welcomeText = chat.customWelcome || "bienvenido al grupo @user"

    welcomeText = welcomeText.replace(/\\n/g, '\n')
    
    let finalCaption = welcomeText.replace(/@user/g, mentionListText) 

    try {
        const messageOptions = {
            mentions: users
        }

        // CONTROL ESTRICTO DE IMAGEN/TEXTO: Solo envía imagen si es una cadena de texto válida (URL)
        if (typeof ppGroup === 'string' && ppGroup.length > 0) {
            messageOptions.image = { url: ppGroup }
            messageOptions.caption = finalCaption
        } else {
            // Envía solo TEXTO (soluciona el ERR_INVALID_ARG_TYPE)
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

    // Escucha eventos de adición directa (ADD) y de aprobación de solicitudes (JOIN)
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
