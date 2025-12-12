import fetch from 'node-fetch';
import { sticker } from '../lib/sticker.js';

const POLLINATIONS_BASE_URL = 'https://text.pollinations.ai';

export async function before(m, { conn }) {
    if (!conn.user) return true;

    let user = global.db.data.users[m.sender];
    let chat = global.db.data.chats[m.chat];

    // Asegura que es un array (CORRECCIÓN DE ERROR 1)
    let mentionedJidSafe = Array.isArray(m.mentionedJid) ? m.mentionedJid : [];

    let botJid = conn.user.jid;
    let botNumber = botJid.split('@')[0];
    let text = m.text || '';

    // CONDICIÓN CLAVE DE ACTIVACIÓN HÍBRIDA (LA ÚNICA QUE FUNCIONÓ EN TU ENTORNO)
    // 1. Detección oficial (mentionedJidSafe)
    // 2. Detección genérica (si el texto empieza con @, asume que es una mención al bot)
    let isBotExplicitlyMentioned = mentionedJidSafe.includes(botJid) || text.trim().startsWith('@');
    
    if (!isBotExplicitlyMentioned) {
        return true;
    }

    // --- El bot ha sido mencionado. Procedemos a limpiar la consulta. ---

    let query = text;

    // 1. Limpiamos todas las JIDs mencionadas en la lista (esto elimina @otros y @bot si aparecen)
    for (let jid of mentionedJidSafe) {
        query = query.replace(new RegExp(`@${jid.split('@')[0]}`, 'g'), '').trim();
    }
    
    // 2. Limpiamos cualquier rastro de @ al inicio que pueda haber quedado (maneja el @cualquiera que activó)
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
