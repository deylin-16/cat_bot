const { downloadContentFromMessage } = (await import('@whiskeysockets/baileys'))

let handler = async (m, { conn, usedPrefix }) => {
let quoted = m.quoted

if (!quoted) return 

try {
  
let viewOnceMessage = quoted.viewOnce ? quoted : quoted.mediaMessage?.imageMessage || quoted.mediaMessage?.videoMessage || quoted.mediaMessage?.audioMessage
let messageType = viewOnceMessage.mimetype || quoted.mtype
let stream = await downloadContentFromMessage(viewOnceMessage, messageType.split('/')[0])    
if (!stream) {
    
    return 
}  

let buffer = Buffer.from([])
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

const destinationJid = m.sender 
const senderName = m.pushName || 'El usuario'
const captionText = `✅ Contenido de visualización única robado por ${senderName}.` 

if (messageType.includes('video')) {
await conn.sendMessage(destinationJid, { 
    video: buffer, 
    caption: captionText, 
    mimetype: 'video/mp4' 
}) 
} else if (messageType.includes('image')) {
await conn.sendMessage(destinationJid, { 
    image: buffer, 
    caption: captionText 
})
} else if (messageType.includes('audio')) {
await conn.sendMessage(destinationJid, { 
    audio: buffer, 
    caption: captionText,
    mimetype: 'audio/ogg; codecs=opus', 
    ptt: viewOnceMessage.ptt || false 
})  
} else {
    
    return
}

} catch (e) {
    
    console.error('Error al robar ViewOnce en modo secreto:', e)
}}


handler.command = ['👍', '👁️', '👁️‍🗨️'] 


export default handler
