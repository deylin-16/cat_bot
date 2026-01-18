import WAMessageStubType from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

const makeFkontak = (img, title, botname) => ({
  key: { fromMe: false, participant: "0@s.whatsapp.net" },
  message: {
    productMessage: {
      product: {
        productImage: { jpegThumbnail: img },
        title: title,
        description: botname,
        currencyCode: "USD",
        priceAmount1000: "5000",
        retailerId: "BOT"
      },
      businessOwnerJid: "0@s.whatsapp.net"
    }
  }
})

export async function before(m, { conn, participants, groupMetadata }) {
  if (!m.isGroup) return
  const chat = global.db.data.chats[m.chat] || {}
  if (!chat.detect) return

  let botSettings = global.db.data.settings[conn.user.jid] || {}
  if (botSettings.soloParaJid) return
  if (!m.messageStubType) return

  const botname = "𝗠𝗲𝗷𝗼𝗿 𝗕𝗼𝘁"
  const urlapi = `https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767146401111_3j2wTlRTQ8.jpeg`
  const thumb = Buffer.from(await (await fetch(urlapi)).arrayBuffer())
  const fkontak = makeFkontak(thumb, `𝗦𝗬𝗦𝗧𝗘𝗠 𝗟𝗢𝗚 🛡️`, botname)
  
  let usuario = `@${m.sender.split`@`[0]}`
  let pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => null) || urlapi
  let tipo = '', mensaje = '', icon = 'ℹ️'

  const st = m.messageStubType
  const param = m.messageStubParameters || []

  if (st == 21) {
    icon = '📝'; tipo = '𝗡𝗢𝗠𝗕𝗥𝗘 𝗔𝗖𝗧𝗨𝗔𝗟𝗜𝗭𝗔𝗗𝗢'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Nuevo:* ${param[0]}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 22) {
    icon = '🖼️'; tipo = '𝗜𝗠𝗔𝗚𝗘𝗡 𝗗𝗘𝗟 𝗚𝗥𝗨𝗣𝗢'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Estado:* Actualizada\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 23) {
    icon = '🔗'; tipo = '𝗘𝗡𝗟𝗔𝗖𝗘 𝗗𝗘 𝗜𝗡𝗩𝗜𝗧𝗔𝗖𝗜𝗢́𝗡'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Acción:* Restablecido\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 25) {
    icon = '⚙️'; tipo = '𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗖𝗜𝗢́𝗡'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Permisos:* ${param[0] == 'on' ? 'Solo Admins' : 'Todos'}\n┃ 👤 *Editor:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 26) {
    icon = param[0] == 'on' ? '🔒' : '🔓'; tipo = '𝗘𝗦𝗧𝗔𝗗𝗢 𝗗𝗘𝗟 𝗖𝗛𝗔𝗧'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Chat:* ${param[0] == 'on' ? 'Cerrado' : 'Abierto'}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 27) {
    icon = '📥'; tipo = '𝗨𝗡𝗜𝗗𝗢 𝗣𝗢𝗥 𝗘𝗡𝗟𝗔𝗖𝗘'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* ${usuario}\n┃ 📎 *Metodo:* Link Directo\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 28) {
    icon = '👤'; tipo = '𝗠𝗜𝗘𝗠𝗕𝗥𝗢 𝗔𝗡̃𝗔𝗗𝗜𝗗𝗢'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* @${param[0]?.split('@')[0]}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 29) {
    icon = '⚡'; tipo = '𝗡𝗨𝗘𝗩𝗢 𝗔𝗗𝗠𝗜𝗡𝗜𝗦𝗧𝗥𝗔𝗗𝗢𝗥'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* @${param[0]?.split('@')[0]}\n┃ 👤 *Acción por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 30) {
    icon = '❌'; tipo = '𝗔𝗗𝗠𝗜𝗡 𝗗𝗘𝗚𝗥𝗔𝗗𝗔𝗗𝗢'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *User:* @${param[0]?.split('@')[0]}\n┃ 👤 *Acción por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 32) {
    icon = '📤'; tipo = '𝗨𝗦𝗨𝗔𝗥𝗜𝗢 𝗦𝗔𝗟𝗜𝗢́'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Acción:* Abandono voluntario\n┃ 👤 *User:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 123) {
    icon = '⏳'; tipo = '𝗠𝗘𝗡𝗦𝗔𝗝𝗘𝗦 𝗧𝗘𝗠𝗣𝗢𝗥𝗔𝗟𝗘𝗦'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Tiempo:* ${param[0] == '0' ? 'Desactivado' : param[0] + 's'}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 145) {
    icon = '🏛️'; tipo = '𝗖𝗢𝗠𝗨𝗡𝗜𝗗𝗔𝗗 𝗖𝗥𝗘𝗔𝗗𝗔'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Nombre:* ${param[0]}\n┃ 👤 *Creador:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else if (st == 171) {
    icon = '🔔'; tipo = '𝗔𝗣𝗥𝗢𝗕𝗔𝗖𝗜𝗢́𝗡 𝗗𝗘 𝗠𝗜𝗘𝗠𝗕𝗥𝗢𝗦'; mensaje = `┏━━━━━━━━━━━━━━━━━━┓\n┃ ${icon} *Estado:* ${param[0] == 'on' ? 'Activado' : 'Desactivado'}\n┃ 👤 *Por:* ${usuario}\n┗━━━━━━━━━━━━━━━━━━┛`
  } else {
    return
  }

  const productMessage = {
    product: {
      productImage: { url: pp },
      productId: '2452968910',
      title: `${tipo}`,
      description: `Registro Detallado de Seguridad`,
      currencyCode: 'USD',
      priceAmount1000: '0',
      retailerId: 'SYSTEM-MONITOR',
      productImageCount: 1
    },
    businessOwnerJid: m.sender,
    caption: `🛡️ *LOGS DE ACTIVIDAD*\n\n${mensaje}`,
    footer: `📅 ${new Date().toLocaleString('es-ES', { timeZone: 'America/Mexico_City' })}`,
    mentions: [m.sender, ...param]
  }

  await conn.sendMessage(m.chat, productMessage, { 
    quoted: fkontak, 
    contextInfo: { 
      mentionedJid: [m.sender, ...param],
      externalAdReply: {
        title: `NOTIFICATION: ${tipo}`,
        body: groupMetadata.subject,
        mediaType: 1,
        thumbnailUrl: pp,
        renderLargerThumbnail: false
      }
    } 
  })
}

export async function handler(m, { text, args, command }) {
    if (!m.isGroup) return
    const chat = global.db.data.chats[m.chat]
    if (command === 'detect') {
        if (!args[0]) return m.reply(`*Uso:* !detect on/off`)
        if (args[0] === 'on') {
            chat.detect = true
            m.reply('✅ Sistema de detección activado.')
        } else if (args[0] === 'off') {
            chat.detect = false
            m.reply('❌ Sistema de detección desactivado.')
        }
    }
}
