import WAMessageStubType from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

export async function before(m, { conn, participants, groupMetadata }) {
  if (!m.isGroup) return
  const chat = global.db.data.chats[m.chat] || {}
  if (!chat.detect) return

  let botSettings = global.db.data.settings[conn.user.jid] || {}
  if (botSettings.soloParaJid) return
  if (!m.messageStubType) return

  const botname = name(conn)
  const urlapi = `https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767146401111_3j2wTlRTQ8.jpeg`
  
  let usuario = `@${m.sender.split`@`[0]}`
  let pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => urlapi)
  let tipo = '', mensaje = '', icon = '🛡️'

  const st = m.messageStubType
  const param = m.messageStubParameters || []

  if (st == 21) {
    icon = '📝'; tipo = 'NOMBRE ACTUALIZADO'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Nuevo:* ${param[0]}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 22) {
    icon = '🖼️'; tipo = 'IMAGEN DEL GRUPO'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Estado:* Actualizada\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 23) {
    icon = '🔗'; tipo = 'ENLACE DE GRUPO'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Acción:* Restablecido\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 25) {
    icon = '⚙️'; tipo = 'CONFIGURACIÓN'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Permisos:* ${param[0] == 'on' ? 'Solo Admins' : 'Todos'}\n┃ 👤 *Editor:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 26) {
    icon = param[0] == 'on' ? '🔒' : '🔓'; tipo = 'ESTADO DEL CHAT'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Chat:* ${param[0] == 'on' ? 'Cerrado' : 'Abierto'}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 27 || st == 28) {
    icon = '📥'; tipo = 'NUEVO MIEMBRO'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* ${st == 28 ? `@${param[0]?.split('@')[0]}` : usuario}\n┃ 📋 *Info:* Unido al grupo\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 29) {
    icon = '⚡'; tipo = 'NUEVO ADMINISTRADOR'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* @${param[0]?.split('@')[0]}\n┃ 👤 *Acción por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 30) {
    icon = '❌'; tipo = 'ADMIN DEGRADADO'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* @${param[0]?.split('@')[0]}\n┃ 👤 *Acción por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 32) {
    icon = '📤'; tipo = 'USUARIO SALIÓ'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Acción:* Abandonó el grupo\n┃ 👤 *User:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 123) {
    icon = '⏳'; tipo = 'MENSAJES TEMPORALES'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Tiempo:* ${param[0] == '0' ? 'Off' : param[0] + 's'}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 145) {
    icon = '🏛️'; tipo = 'COMUNIDAD'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Nombre:* ${param[0]}\n┃ 👤 *Creador:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 171) {
    icon = '🔔'; tipo = 'APROBACIÓN'
    mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Estado:* ${param[0] == 'on' ? 'Activado' : 'Desactivado'}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else {
    return
  }

  const taguser = usuario
  const groupSubject = groupMetadata.subject
  const date = new Date().toLocaleString('es-ES', { timeZone: 'America/Mexico_City' })

  await conn.sendMessage(m.chat, {
    text: `🛡️ *𝗦𝗬𝗦𝗧𝗘𝗠 𝗗𝗘𝗧𝗘𝗖𝗧 𝗔𝗖𝗧𝗜𝗩𝗘*\n\n${mensaje}\n\n> 📅 _${date}_`,
    contextInfo: {
      mentionedJid: [m.sender, ...param],
      externalAdReply: {
        title: `LOG: ${tipo}`,
        body: `Comunidad: ${botname}`,
        mediaType: 1,
        previewType: 0,
        thumbnailUrl: pp,
        sourceUrl: 'https://github.com/deylin-q', // Puedes poner tu link de creador aquí
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })
}
