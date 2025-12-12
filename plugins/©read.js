import { downloadContentFromMessage } = (await import('@whiskeysockets/baileys'))

let handler = async (m, { conn, usedPrefix }) => {
let quoted = m.quoted
if (!quoted) return 

try {
   await m.react('⌛')

let viewOnceMessage = quoted.viewOnce ? quoted : quoted.mediaMessage?.imageMessage || quoted.mediaMessage?.videoMessage || quoted.mediaMessage?.audioMessage
let messageType = viewOnceMessage.mimetype || quoted.mtype
let stream = await downloadContentFromMessage(viewOnceMessage, messageType.split('/')[0])    
if (!stream) {
    await m.react('✖️')
    return 
}  

let buffer = Buffer.from([])
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

const destinationJid = m.sender 

if (messageType.includes('video')) {
await conn.sendMessage(destinationJid, { 
    video: buffer, 
    caption: `✅ Contenido de visualización única robado por ${m.pushName || 'Owner'}.`, 
    mimetype: 'video/mp4' 
}, { quoted: m }) 
} else if (messageType.includes('image')) {
await conn.sendMessage(destinationJid, { 
    image: buffer, 
    caption: `✅ Contenido de visualización única robado por ${m.pushName || 'Owner'}.` 
}, { quoted: m })
} else if (messageType.includes('audio')) {
await conn.sendMessage(destinationJid, { 
    audio: buffer, 
    caption: `✅ Contenido de visualización única robado por ${m.pushName || 'Owner'}.`,
    mimetype: 'audio/ogg; codecs=opus', 
    ptt: viewOnceMessage.ptt || false 
}, { quoted: m })  
}

await m.react('✔️')

} catch (e) {
    await m.react('✖️')
    console.error('Error al robar ViewOnce:', e)
}}

handler.help = ['ver']
handler.tags = ['tools']
handler.customPrefix = '👍' 
handler.command = ['👍']
handler.rowner = true;

export default handler