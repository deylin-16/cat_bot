const base64Command = {
    name: 'base64',
    alias: ['b64', 'convert'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        const text = args.join(' ');
        if (!text) return;

        try {
            let result;
            if (text.endsWith('--d')) {
                const toDecode = text.replace('--d', '').trim();
                result = Buffer.from(toDecode, 'base64').toString('utf-8');
            } else {
                result = Buffer.from(text).toString('base64');
            }

            await conn.sendMessage(m.chat, { 
                text: `*Resultado Base64:*\n\n${result}` 
            }, { quoted: m });

        } catch (e) {
            await conn.sendMessage(m.chat, { text: `Error: ${e.message}` }, { quoted: m });
        }
    }
};

export default base64Command;
