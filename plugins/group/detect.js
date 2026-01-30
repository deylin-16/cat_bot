import { WAMessageStubType } from '@whiskeysockets/baileys'

const detectHandler = {
  async before(m, { conn, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return

    const chat = global.db?.data?.chats?.[m.chat] || {}
    if (chat.detect === false) return

    const botname = global.name()
    const urlapi = global.img()

    let emisor = m.sender || m.messageStubParameters?.[0] || '0@s.whatsapp.net'
    let usuario = `@${emisor.split`@`[0]}`
    let tipo = '', mensaje = '', icon = '🛡️', descFinal = ''
    let thumb = urlapi

    const st = m.messageStubType
    const param = m.messageStubParameters || []

    if (st == WAMessageStubType.GROUP_CHANGE_SUBJECT) {
      icon = '📝'; tipo = 'NOMBRE ACTUALIZADO'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Nuevo:* ${param[0]}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
    } else if (st == WAMessageStubType.GROUP_CHANGE_ICON) {
      icon = '🖼️'; tipo = 'IMAGEN DEL GRUPO'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Estado:* Actualizada\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
      thumb = await conn.profilePictureUrl(m.chat, 'image').catch(_ => urlapi)
    } else if (st == WAMessageStubType.GROUP_CHANGE_DESCRIPTION) {
      icon = '📜'; tipo = 'DESCRIPCIÓN'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Acción:* Modificada\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
      descFinal = `\n\n*📝 Descripción:* ${param[0] || 'Actualizada'}`
    } else if (st == WAMessageStubType.GROUP_CHANGE_INVITE_LINK) {
      icon = '🔗'; tipo = 'ENLACE DE GRUPO'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Acción:* Restablecido\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
    } else if (st == WAMessageStubType.GROUP_CHANGE_RESTRICT) {
      icon = '⚙️'; tipo = 'CONFIGURACIÓN'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Permisos:* ${param[0] == 'on' ? 'Solo Admins' : 'Todos'}\n┃ 👤 *Editor:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
    } else if (st == WAMessageStubType.GROUP_PROMOTE_ADMIN) {
      icon = '⚡'; tipo = 'NUEVO ADMINISTRADOR'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* @${param[0]?.split('@')[0]}\n┃ 👤 *Acción por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
    } else if (st == WAMessageStubType.GROUP_DEMOTE_ADMIN) {
      icon = '❌'; tipo = 'ADMIN DEGRADADO'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* @${param[0]?.split('@')[0]}\n┃ 👤 *Acción por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
    } else if (st == WAMessageStubType.BIZ_PRIVACY_MODE_INITIATED) {
      icon = '⏳'; tipo = 'MENSAJES TEMPORALES'
      mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Tiempo:* ${param[0] == '0' ? 'Off' : param[0] + 's'}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
    } else {
      return
    }

    await conn.sendMessage(m.chat, {
      text: `${mensaje}\n\n> 📅 _${global.fecha}_${descFinal}`,
      contextInfo: {
        mentionedJid: [emisor, ...param],
        externalAdReply: {
          title: `LOG: ${tipo}`,
          body: groupMetadata?.subject || botname,
          mediaType: 1,
          thumbnailUrl: thumb,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: null })
  }
}

export default detectHandler
