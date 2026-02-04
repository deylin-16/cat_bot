const fetch = require('node-fetch');

const postCommand = {
    name: 'post',
    alias: ['curl'],
    category: 'owner',
    owner: true,
    run: async (client, message, args) => {
        const { remoteJid } = message;
        const text = args.join(' ');

        if (!text) return;

        const urlRegex = /https?:\/\/[^\s]+/g;
        const url = text.match(urlRegex)?.[0];
        
        const bodyMatch = text.match(/-d\s+'({.+})'/);
        const bodyData = bodyMatch ? JSON.parse(bodyMatch[1]) : null;

        if (!url) return client.sendMessage(remoteJid, { text: 'URL no encontrada.' });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyData ? JSON.stringify(bodyData) : null
            });

            const data = await response.json();
            
            let output = JSON.stringify(data, null, 2);

            await client.sendMessage(remoteJid, { 
                text: `*Respuesta del Servidor:*\n\n\`\`\`json\n${output}\n\`\`\`` 
            });

        } catch (e) {
            await client.sendMessage(remoteJid, { text: `Error: ${e.message}` });
        }
    }
};

module.exports = postCommand;
