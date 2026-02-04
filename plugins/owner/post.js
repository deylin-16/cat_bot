import fetch from 'node-fetch';

const postCommand = {
    name: 'post',
    alias: ['curl'],
    category: 'owner',
    run: async (m, { conn, args, isROwner }) => {
        if (!isROwner) return;

        const text = args.join(' ');
        if (!text) return;

        const urlRegex = /https?:\/\/[^\s]+/g;
        const url = text.match(urlRegex)?.[0];

        const bodyMatch = text.match(/-d\s+'({.+})'/);
        let bodyData = null;

        if (bodyMatch) {
            try {
                bodyData = JSON.parse(bodyMatch[1]);
            } catch {
                bodyData = null;
            }
        }

        if (!url) return;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyData ? JSON.stringify(bodyData) : null
            });

            const data = await response.json();
            const output = JSON.stringify(data, null, 2);

            await conn.sendMessage(m.chat, { 
                text: `*Respuesta del Servidor:*\n\n\`\`\`json\n${output}\n\`\`\`` 
            }, { quoted: m });

        } catch (e) {
            await conn.sendMessage(m.chat, { text: `Error: ${e.message}` }, { quoted: m });
        }
    }
};

export default postCommand;
