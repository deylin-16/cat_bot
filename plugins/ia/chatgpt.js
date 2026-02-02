import fetch from "node-fetch";

const chatgptCommand = {
    name: 'chatgpt',
    alias: ['ia', 'gpt', 'chatgpt'],
    category: 'ai',
    run: async (m, { conn, text }) => {
        if (!text) return conn.sendMessage(m.chat, { text: '¡Hola! ¿En qué puedo ayudarte hoy?' }, { quoted: m });
        
        await m.react('⏳');
        try {
            const url = `${global.url_api}/api/ai/text/chatgpt?q=${encodeURIComponent(text)}&apikey=by_deylin`;
            const res = await fetch(url);
            const data = await res.json();

            if (!data.response) throw new Error();

            await m.react('✅');
            await conn.sendMessage(m.chat, { text: data.response }, { quoted: m });

        } catch (e) {
            await m.react('❌');
            await conn.sendMessage(m.chat, { text: '⚠️ Error al conectar con ChatGPT.' }, { quoted: m });
        }
    }
};

export default chatgptCommand;
