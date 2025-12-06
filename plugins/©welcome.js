import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

async function obtenerPais(numero) {
  try {
    let number = numero.replace("@s.whatsapp.net", "")
    const res = await fetch(`https://g-mini-ia.vercel.app/api/infonumero?numero=${number}`)
    const data = await res.json()

    if (data && data.pais) return data.pais
    if (data && data.bandera && data.nombre) return `${data.bandera} ${data.nombre}`

    return "🌐 Desconocido"
  } catch (e) {
    return "🌐 Desconocido"
  }
}

async function sendBatchedWelcome(conn, jid) {
    const batch = conn.welcomeBatch[jid]
    if (!batch || batch.users.length === 0) return

    clearTimeout(batch.timer)

    const users = batch.users
    const groupMetadata = (await conn.groupMetadata(jid).catch(() => ({}))) || {}
    const chat = global.db?.data?.chats?.[jid] || {}

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

        if (ppGroup) {
            messageOptions.image = { url: ppGroup }
            messageOptions.caption = finalCaption
        } else {
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

    // CONDICIÓN MODIFICADA: La bienvenida se activa por defecto (no es estrictamente 'false')
    // Solo se desactiva si el administrador la configuró como 'off'
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
