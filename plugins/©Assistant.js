import fetch from 'node-fetch'
import { handleJijiCommand, ACTION_SYNONYMS } from './©prueba.js' 

const POLLINATIONS_BASE_URL = 'https://text.pollinations.ai';

let handler = m => m 

handler.all = async function (m, { conn, isROwner, isOwner, isRAdmin, participants, groupMetadata, command }) {
    let user = global.db.data.users[m.sender]
    let chat = global.db.data.chats[m.chat]

    m.isBot = m.id.startsWith('BAE5') && m.id.length === 16 
            || m.id.startsWith('3EB0') && (m.id.length === 12 || m.id.length === 20 || m.id.length === 22) 
            || m.id.startsWith('B24E') && m.id.length === 20
    if (m.isBot) return 

    let prefixRegex = new RegExp('^[' + (opts?.prefix || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
    
    let [mainCommand] = (m.text || '').trim().toLowerCase().split(/\s+/);
    
    if (mainCommand === 'jiji') {
        const commandParams = { isROwner, isOwner, isRAdmin, participants, groupMetadata, command: 'jiji' };
        const executedAction = await handleJijiCommand(m, conn, commandParams); 
        if (executedAction) return true; 
    }

    if (prefixRegex.test(m.text)) return true 
    
    if (global.plugins[mainCommand]) return true
    
    if (m.sender?.toLowerCase().includes('bot')) return true

    if (!chat.isBanned && chat.autoresponder) {
        if (m.fromMe) return

        let query = m.text || ''
        let username = m.pushName || 'Usuario'

        let isOrBot = /(jiji|gato|asistente)/i.test(query)
        let isReply = m.quoted && m.quoted.sender === conn.user.jid
        let isMention = m.mentionedJid && m.mentionedJid.includes(conn.user.jid) 

        if (!(isOrBot || isReply || isMention)) return

        await conn.sendPresenceUpdate('composing', m.chat)

        const adminKeywords = new RegExp(`(jiji|${Object.values(ACTION_SYNONYMS).flat().join('|')})`, 'i');

        if (adminKeywords.test(query)) {
             await conn.reply(m.chat, '🙄 Eso es trabajo de mantenimiento, no una pregunta existencial. No me mezcles en tus tareas de administrador.', m);
             return;
        }


        let jijiPrompt = `Eres Jiji, un gato negro sarcástico y leal, como el de Kiki: Entregas a Domicilio. Responde a ${username}: ${query}. 
        
        nota: si vas a resaltar un texto solo usas un * en cada esquina no ** y separa bien los párrafos y eso.`;

        let promptToSend = chat.sAutoresponder ? chat.sAutoresponder : jijiPrompt;

        try {
            const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(promptToSend)}`;
            const res = await fetch(url)

            if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status}`);
            }

            let result = await res.text()

            if (result && result.trim().length > 0) {
                await conn.reply(m.chat, result, m)
            }
        } catch (e) {
            console.error(e)
            await conn.reply(m.chat, '⚠️ ¡Rayos! No puedo contactar con la nube de la IA. Parece que mis antenas felinas están fallando temporalmente.', m)
        }
    }
    return true
}

export default handler
