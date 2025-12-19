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

handler.all = async function (m, { conn }) {
    let chat = global.db.data.chats[m.chat]
    if (!chat || chat.isBanned || !chat.autoresponder) return

    m.isBot = m.id.startsWith('BAE5') && m.id.length === 16 
            || m.id.startsWith('3EB0') && (m.id.length === 12 || m.id.length === 20 || m.id.length === 22) 
            || m.id.startsWith('B24E') && m.id.length === 20
    if (m.isBot || m.fromMe) return 

    let rawText = m.text || ''
    let queryLower = rawText.toLowerCase().trim()
    let cleanQuery = queryLower.replace(/^(jiji|gato|asistente)\s+/, '').trim()

    if (respuestasPredefinidas[cleanQuery] || respuestasPredefinidas[queryLower]) {
        let txt = respuestasPredefinidas[cleanQuery] || respuestasPredefinidas[queryLower]
        await this.sendPresenceUpdate('composing', m.chat)
        await new Promise(resolve => setTimeout(resolve, 800))
        await this.reply(m.chat, txt, m)
        return true 
    }

    let prefixRegex = new RegExp('^[' + (opts?.prefix || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
    if (prefixRegex.test(rawText)) return true

    let isOrBot = /(jiji.|gato|asistente)/i.test(rawText)
    let isReply = m.quoted && m.quoted.sender === this.user.jid
    let isMention = m.mentionedJid && m.mentionedJid.includes(this.user.jid) 

    if (!(isOrBot || isReply || isMention)) return

    if (DIRECT_COMMAND_REGEX.test(queryLower)) {
        if (!/(como|cómo|que|qué|donde|dónde|porque|por qué|porqué|quisiera)/i.test(queryLower)) return true
    }

    await this.sendPresenceUpdate('composing', m.chat)

    let assistantName = m.isGroup && typeof global.getGroupAssistantConfig === 'function' 
        ? global.getGroupAssistantConfig(m.chat).assistantName 
        : (global.bot || 'Asistente');

    let username = m.pushName || 'Usuario'
    let jijiPrompt = `Eres ${assistantName}. Tu personalidad: Sarcástico, enojón, directo, divertido pero furioso, demuestras poder y adorable. Responde a ${username}: ${rawText}. Usa * para resaltar.`;

    try {
        const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(jijiPrompt)}`;
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        let result = await res.text()
        
        if (result && result.trim().length > 0) {
            let fullText = result.trim()
            let words = fullText.split(' ')
            
            let { key } = await conn.sendMessage(m.chat, { text: '✍️...' }, { quoted: m })
            
            let currentText = ''
            for (let i = 0; i < words.length; i++) {
                currentText += words[i] + ' '
                
                if (i % 3 === 0 || i === words.length - 1) {
                    await conn.sendMessage(m.chat, { text: currentText.trim(), edit: key })
                    await new Promise(resolve => setTimeout(resolve, 150))
                }
            }
        }
    } catch (e) {
        console.error(e)
        await this.reply(m.chat, '⚠️ Fallo en la conexión cerebral.', m)
    }
    return true
}

export default handler
