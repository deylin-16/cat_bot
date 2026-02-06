import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const respuestasPath = path.join(process.cwd(), './db/artificial_intelligence_simulation_responses.json');

if (!fs.existsSync(path.dirname(respuestasPath))) {
    fs.mkdirSync(path.dirname(respuestasPath), { recursive: true });
}

let respuestasPredefinidas = fs.existsSync(respuestasPath) ? JSON.parse(fs.readFileSync(respuestasPath, 'utf-8')) : {};

const geminiCommand = {
    name: 'gemini',
    alias: ['bot', 'gato', 'cat', 'ia'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: '*[!] Ingrese su consulta.*' }, { quoted: m });
        await chatAI(m, conn, text);
    },
    all: async function (m, { conn }) {
        if (!m.text || m.fromMe || m.isBaileys) return;

        let queryLower = m.text.toLowerCase().trim();

        if (respuestasPredefinidas[queryLower]) {
            return await conn.sendMessage(m.chat, { text: respuestasPredefinidas[queryLower] }, { quoted: m });
        }

        const keywords = ['gato', 'cat', 'bot', 'gemini'];
        if (keywords.some(word => queryLower.includes(word))) {
            await chatAI(m, conn, m.text);
        }
    }
};

async function chatAI(m, conn, query) {
    let assistantName = 'CAT BOT OS';
    let username = m.pushName || 'Usuario';

    let prompt = `Eres ${assistantName}. Creado por Deylin Eliac. Eres serio, directo y con autoridad. No uses negritas dobles, usa asteriscos simples (*). Si ${username} te insulta, responde con la misma agresividad. Usuario actual: ${username}. Responde a: ${query} nunca mientes tu personalidad sin que te la pida...`;

    try {
        const url = `https://api.deylin.xyz/api/ai/text/ai?prompt=${encodeURIComponent(prompt)}&id=${m.sender}`;
        const response = await fetch(url);
        
        const result = await response.text();
        const json = JSON.parse(result);

        if (json.response) {
            
            let reply = json.response.replace(/\\n/g, '\n').trim();
            await conn.sendMessage(m.chat, { text: reply }, { quoted: m });
        }
    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { text: '*[ ❌ ] Error en Red Z.*' }, { quoted: m });
    }
}

export default geminiCommand;
