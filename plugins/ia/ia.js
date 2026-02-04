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
    all: async function (m) {
        if (!m.text || m.fromMe || m.isBaileys) return;

        let queryLower = m.text.toLowerCase().trim();
        
        if (respuestasPredefinidas[queryLower]) {
            return await this.sendMessage(m.chat, { text: respuestasPredefinidas[queryLower] }, { quoted: m });
        }

        const keywords = ['gato', 'cat', 'bot', 'gemini'];
        if (keywords.some(word => queryLower.includes(word))) {
            await chatAI(m, this, m.text);
        }
    }
};

async function chatAI(m, conn, query) {
    let assistantName = global.db?.data?.settings?.namebot || 'CAT BOT OS';
    let username = m.pushName || 'Usuario';
    
    let prompt = `Eres ${assistantName}. Creado por Deylin Eliac. Eres serio, directo y con autoridad. No uses negritas dobles, usa asteriscos simples (*). Si ${username} te insulta, responde con la misma agresividad. Usuario actual: ${username}. Responde a: ${query}`;

    try {
        const response = await fetch(`${global.api.url}/api/ai/text/ai?prompt=${encodeURIComponent(prompt)}&id=${m.sender}`);
        const json = await response.json();

        if (json.response) {
            await conn.sendMessage(m.chat, { text: json.response.trim() }, { quoted: m });
        }
    } catch (err) {
        await conn.sendMessage(m.chat, { text: '*[ ❌ ] Error en Red Z.*' }, { quoted: m });
    }
}

export default geminiCommand;
