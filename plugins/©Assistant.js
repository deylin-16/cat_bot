import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const respuestasPath = path.join(process.cwd(), './db/artificial_intelligence_simulation_responses.json');
let respuestasPredefinidas = {};

if (fs.existsSync(respuestasPath)) {
    respuestasPredefinidas = JSON.parse(fs.readFileSync(respuestasPath, 'utf-8'));
}

const POLLINATIONS_BASE_URL = 'https://text.pollinations.ai';
const ACTION_KEYWORDS = ['cierra', 'cerrar', 'bloquea', 'ciérralo', 'silencia', 'modo-admin', 'abre', 'abrir', 'desbloquea', 'ábrelo', 'quita modo-admin', 'cambia el nombre', 'renombrar', 'ponle nombre', 'nuevo nombre', 'actualiza nombre', 'cambia la descripción', 'pon descripción', 'nueva descripción', 'descr', 'cambia la foto', 'pon foto', 'cambiar imagen', 'elimina', 'sacar', 'kickea', 'expulsa', 'saca', 'fuera', 'menciona todos', 'tagall', 'menciónalos', 'aviso a todos'];
const DIRECT_COMMAND_REGEX = new RegExp(`^(jiji|gato|asistente)\\s+(${ACTION_KEYWORDS.join('|')})`, 'i');

let handler = m => m

handler.all = async function (m) {
    const conn = this; 
    if (!m.text) return
    
    let chat = global.db.data?.chats?.[m.chat]
    if (chat?.isBanned) return

    const botJid = conn.user.jid
    const isOrBot = /(jiji|gato|asistente)/i.test(m.text)
    const isReply = m.quoted && m.quoted.sender === botJid
    const isMention = m.mentionedJid && m.mentionedJid.includes(botJid) 

    if (!(isOrBot || isReply || isMention)) return

    let queryLower = m.text.toLowerCase().trim()
    let cleanQuery = queryLower.replace(/^(jiji|gato|asistente)\s+/, '').trim()

    if (respuestasPredefinidas[cleanQuery] || respuestasPredefinidas[queryLower]) {
        let txt = respuestasPredefinidas[cleanQuery] || respuestasPredefinidas[queryLower]
        await conn.sendPresenceUpdate('composing', m.chat)
        await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
        return true 
    }

    if (DIRECT_COMMAND_REGEX.test(queryLower)) {
        if (!/(como|cómo|que|qué|donde|dónde|porque|por qué|porqué|quisiera)/i.test(queryLower)) return true
    }

    let { key } = await conn.sendMessage(m.chat, { text: 'Pensando...' }, { quoted: m })
    await conn.sendPresenceUpdate('composing', m.chat)

    let assistantName = (global.bot || 'Asistente');
    let username = m.pushName || 'Usuario'
    let jijiPrompt = `Eres ${assistantName}. Tu personalidad: Sarcástico, enojón, directo, divertido pero furioso, demuestras poder y adorable. Responde a ${username}: ${m.text}. Usa * para resaltar.`;

    try {
        const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(jijiPrompt)}?model=openai&cache=true`;
        const res = await fetch(url)
        let result = await res.text()

        if (result && result.trim().length > 0) {
            await conn.sendMessage(m.chat, { text: 'Escribiendo...', edit: key })
            await new Promise(resolve => setTimeout(resolve, 1500))

            let fullText = result.trim()
            let words = fullText.split(' ')
            let step = fullText.length > 500 ? 30 : (fullText.length > 200 ? 15 : 8);
            let speed = 1000; 

            let currentText = ''
            for (let i = 0; i < words.length; i += step) {
                currentText = words.slice(0, i + step).join(' ')
                await conn.sendMessage(m.chat, { text: currentText.trim(), edit: key })
                await new Promise(resolve => setTimeout(resolve, speed))
            }
            
            await conn.sendMessage(m.chat, { text: fullText, edit: key })
        }
    } catch (e) {
        await conn.sendMessage(m.chat, { text: '💢 Error.', edit: key })
    }
    return true
}

export default handler
