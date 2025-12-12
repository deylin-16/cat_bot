import fetch from 'node-fetch';
import { sticker } from '../lib/sticker.js';

const POLLINATIONS_BASE_URL = 'https://text.pollinations.ai';

export async function before(m, { conn }) {
    if (!conn.user) return true;

    let user = global.db.data.users[m.sender];
    let chat = global.db.data.chats[m.chat];

    let mentionedJidSafe = Array.isArray(m.mentionedJid) ? m.mentionedJid : [];

    let botJid = conn.user.jid;
    let botNumber = botJid.split('@')[0];
    let text = m.text || '';

    // CONDICIÓN DE ACTIVACIÓN: Activamos si el mensaje empieza con '@' (detección agresiva)
    let isMentionedAtAll = text.trim().startsWith('@');
    
    if (!isMentionedAtAll) {
        return true;
    }

    // --- FILTRO ESTRICTO: Si el mensaje empieza por '@', verificamos si es para otro. ---

    // 1. Intentamos extraer el JID (solo el número) mencionado al principio del texto.
    const firstMentionMatch = text.match(/@(\d+)/);

    if (firstMentionMatch) {
        const mentionedJidNumber = firstMentionMatch[1];

        // 2. Si el número mencionado NO coincide con el número del bot, ignoramos la acción.
        if (mentionedJidNumber !== botNumber) {
            
            // FILTRO ADICIONAL: Solo ignoramos si el bot no está en la lista oficial (falla en tu entorno)
            if (!mentionedJidSafe.includes(botJid)) {
                return true; 
            }
        }
    }
    
    // Si llegamos aquí, el mensaje fue para el bot o el filtro falló al detectar a quién iba dirigido.

    // --- El bot debe responder. Procedemos a limpiar la consulta. ---

    let query = text;

    // Limpiamos todas las JIDs mencionadas en la lista (para eliminar @otros y @bot si aparecen)
    for (let jid of mentionedJidSafe) {
        query = query.replace(new RegExp(`@${jid.split('@')[0]}`, 'g'), '').trim();
    }
    
    // Limpiamos cualquier rastro de @ al inicio que pueda haber quedado
    if (query.startsWith('@')) {
        query = query.replace(/^@\S+\s?/, '').trim();
    }
    
    let username = m.pushName || 'Usuario';

    if (query.length === 0) return false;

    let jijiPrompt = `Eres Jiji, un gato negro sarcástico y leal, como el de Kiki: Entregas a Domicilio. Responde a ${username}: ${query}. 
    
    nota: si vas a resaltar un texto solo usas un * en cada esquina no **.`;

    try {
        conn.sendPresenceUpdate('composing', m.chat);

        const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(jijiPrompt)}`;

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }

        let result = await res.text();

        if (result && result.trim().length > 0) {
            
            result = result.replace(/\*\*(.*?)\*\*/g, '*$1*').trim(); 
            
            result = result.replace(/([.?!])\s*/g, '$1\n\n').trim();

            await conn.reply(m.chat, result, m);
            await conn.readMessages([m.key]);
        } else {
            await conn.reply(m.chat, `🐱 Hmph. La IA no tiene nada ingenioso que decir sobre *eso*.`, m);
        }
    } catch (e) {
        await conn.reply(m.chat, '⚠️ ¡Rayos! No puedo contactar con la nube de la IA. Parece que mis antenas felinas están fallando temporalmente.', m);
    }

    return false;
}
