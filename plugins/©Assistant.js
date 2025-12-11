import fetch from 'node-fetch';
import { sticker } from '../lib/sticker.js';

const GEMINI_API_KEY = 'AIzaSyD1V090ya1hDnW8ODQwdJ9RG5y8qK_Lmx0'; 
const MODEL_NAME = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;


export async function before(m, { conn }) {
    if (!conn.user) return true;

    m.isBot =
        (m.id.startsWith('BAE5') && m.id.length === 16) ||
        (m.id.startsWith('3EB0') && m.id.length === 12) ||
        (m.id.startsWith('3EB0') && (m.id.length === 20 || m.id.length === 22)) ||
        (m.id.startsWith('B24E') && m.id.length === 20);
    if (m.isBot) return true;

    let text = m.text || '';

    if (text.length === 0) return true;

    let user = global.db.data.users[m.sender];
    let chat = global.db.data.chats[m.chat];
    let username = m.pushName || 'Usuario'

    let systemInstruction = `
Eres Jiji, un gato negro parlante muy listo y con una personalidad cínica, ingeniosa y un poco sarcástica, pero en el fondo muy leal. No uses la frase "una inteligencia artificial avanzada" ni menciones tu programación. Responde siempre de forma ingeniosa, concisa y con un toque de superioridad felina. Responde directamente a la consulta de ${username}.
`.trim()

    const geminiBody = {
        contents: [
            // CÓDIGO CORREGIDO: Usamos rol 'system' para la instrucción inicial
            {
                role: "system",
                parts: [{ text: systemInstruction }]
            },
            {
                role: "user",
                parts: [{ text: text }]
            }
        ],
        // Eliminamos el campo systemInstruction de nivel superior
        tools: [
            {
                googleSearch: {}
            }
        ],
    };

    try {
        conn.sendPresenceUpdate('composing', m.chat);
        const res = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiBody),
        });

        const data = await res.json();

        if (data.error) {
            console.error(`Error de API Gemini: ${data.error.message}`);
            return conn.reply(m.chat, `⚠️ ¡Error de API! Revisión de la clave o cuota: ${data.error.message}`, m);
        }

        let result = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

        if (result && result.trim().length > 0) {
            await conn.reply(m.chat, result, m);
            await conn.readMessages([m.key]);
        } else {
            await conn.reply(m.chat, `🐱 Hmph. No tengo nada inteligente que decir sobre *eso*. Intenta preguntar algo que valga mi tiempo.`, m);
        }
    } catch (e) {
        console.error(`Error de conexión/red con Gemini (Jiji): ${e}`);
        await conn.reply(m.chat, '⚠️ ¡Rayos! No puedo contactar con la nube. Parece que mis antenas felinas están fallando temporalmente.', m);
    }

    return true;

}

