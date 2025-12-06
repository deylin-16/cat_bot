import { WAMessageStubType } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

this.welcomeBatch = this.welcomeBatch || {} 

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

    let ppGroup = 'https://raw.githubusercontent.com/Deylin-Eliac/Pikachu-Bot/refs/heads/main/src/IMG-20250613-WA0194.jpg'
    try {
        ppGroup = await conn.profilePictureUrl(jid, 'image')
    } catch (e) {}

    const mentionListText = users.map(jid => `@${jid.split("@")[0]}`).join(', ')
    
    let welcomeText = chat.customWelcome || "bienvenido al grupo @user"
    
    let finalCaption = welcomeText.replace(/@user/g, mentionListText).trim()

    try {
        await conn.sendMessage(jid, {
            image: { url: ppGroup },
            caption: finalCaption,
            mentions: users
        })
    } catch (e) {
        console.error(e)
    }

    delete conn.welcomeBatch[jid]
}


export async function before(m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return
    const who = m.messageStubParameters?.[0]
    if (!who) return

    const chat = global.db?.data?.chats?.[m.chat] || {}
    
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD && chat.welcome) {
        
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
