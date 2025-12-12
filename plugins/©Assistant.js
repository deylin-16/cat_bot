import fetch from 'node-fetch';
import { sticker } from '../lib/sticker.js';

const POLLINATIONS_BASE_URL = 'https://text.pollinations.ai';

export async function before(m, { conn }) {
    if (!conn.user) return true;
    
    // CORRECCIÓN CRÍTICA DE ERROR y aseguramiento del Array
    if (!Array.isArray(m.mentionedJid)) {
        m.mentionedJid = m.mentionedJid ? [m.mentionedJid] : [];
    }
    
    let user = global.db.data.users[m.sender];
    let chat = global.db.data.chats[m.chat];
    
    // MANTENEMOS SOLO LA CONDICIÓN DE MENCIÓN
    if (m.mentionedJid.includes(conn.user.jid)) {
        
        let botJid = conn.user.jid;
        let botNumber = botJid.split('@')[0];
        let text = m.text || '';
        
        let query = text.replace(new RegExp(`@${botNumber}`, 'g'), '').trim() || ''
        query = query.replace(/@\w+\s?/, '').trim() || ''
        let username = m.pushName || 'Usuario'

        // EVITAMOS PETICIONES VACÍAS
        if (query.length === 0) return false;

        let jijiPrompt = `Eres Jiji, un gato negro sarcástico y leal, como el de Kiki: Entregas a Domicilio. Responde a ${username}: ${query}`;

        // EJECUCIÓN DE LA API
        try {
            conn.sendPresenceUpdate('composing', m.chat);
            
            const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(jijiPrompt)}`;

            const res = await fetch(url);
            
            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`);
            }

            const result = await res.text();

            if (result && result.trim().length > 0) {
                await conn.reply(m.chat, result.trim(), m);
                await conn.readMessages([m.key]);
            } else {
                await conn.reply(m.chat, `🐱 Hmph. La IA no tiene nada ingenioso que decir sobre *eso*.`, m);
            }
        } catch (e) {
            await conn.reply(m.chat, '⚠️ ¡Rayos! No puedo contactar con la nube de la IA. Parece que mis antenas felinas están fallando temporalmente.', m);
        }

        return false;
    }
    
    return true;
}
