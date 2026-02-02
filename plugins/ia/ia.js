import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const respuestasPath = path.join(process.cwd(), './db/artificial_intelligence_simulation_responses.json');
let respuestasPredefinidas = fs.existsSync(respuestasPath) ? JSON.parse(fs.readFileSync(respuestasPath, 'utf-8')) : {};

const geminiCommand = {
    name: 'gemini',
    alias: ['bot', 'gato', 'asistente'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: '¿Qué quieres?' }, { quoted: m });
        return await chatAI(m, conn, text);
    },
    all: async function (m) {
        if (!m.text || m.fromMe || m.isBaileys) return;
        const botJid = this.user.jid;
        const isOrBot = /(bot|gato)/i.test(m.text);
        const isReply = m.quoted && m.quoted.sender === botJid;
        const isMention = m.mentionedJid && m.mentionedJid.includes(botJid);

        if (!(isOrBot || isReply || isMention)) return;

        let queryLower = m.text.toLowerCase().trim();
        if (respuestasPredefinidas[queryLower]) {
            return await this.sendMessage(m.chat, { text: respuestasPredefinidas[queryLower] }, { quoted: m });
        }

        await chatAI(m, this, m.text);
    }
};

async function chatAI(m, conn, query) {
    let { key } = await conn.sendMessage(m.chat, { text: '*Pensando...*' }, { quoted: m });
    let assistantName = global.name?.(conn) || 'Gemini';
    let username = m.pushName || 'Usuario';
    let prompt = `Eres ${assistantName}. Serio, directo y con autoridad. No uses (**), usa (*). Si ${username} te insulta, responde con la misma agresividad. Responde: ${query}`;

    try {
        const res = await fetch(`${global.url_api}/api/ai/text/ai?prompt=${encodeURIComponent(prompt)}&id=${m.sender}`);
        const json = await res.json();
        if (json.response) {
            await conn.sendMessage(m.chat, { text: json.response.trim(), edit: key });
        }
    } catch {
        await conn.sendMessage(m.chat, { text: '💢 Error.', edit: key });
    }
}

export default geminiCommand;
