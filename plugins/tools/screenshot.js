import fetch from 'node-fetch';

const ssCommand = {
    name: 'ss',
    alias: ['screenshot', 'captura', 'ssweb'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        let link = args[0];

        if (!link) {
            return conn.sendMessage(m.chat, { text: `> ╰❑ *𝗜𝗻𝗴𝗿𝗲𝘀𝗲 𝗲𝗹 𝗲𝗻𝗹𝗮𝗰𝗲 𝗱𝗲 𝘂𝗻𝗮 𝗽𝗮́𝗴𝗶𝗻𝗮 𝘄𝗲𝗯.*` }, { quoted: m });
        }

        if (!/^https?:\/\//.test(link)) link = 'https://' + link;

        try {
            await m.react('⌛');

            const thumApi = `https://image.thum.io/get/width/1200/crop/1200/noanimate/${link}`;

            const response = await fetch(thumApi);
            if (!response.ok) throw new Error('Error al conectar con Thum.io');
            
            const buffer = await response.buffer();

            await conn.sendMessage(m.chat, { 
                image: buffer, 
                caption: `> ✎ *𝗖𝗮𝗽𝘁𝘂𝗿𝗮 𝗱𝗲:* ${link}` 
            }, { quoted: m });

            await m.react('✅');

        } catch (err) {
            console.error(err);
            await conn.sendMessage(m.chat, { text: `> ⍰ *𝗘𝗿𝗿𝗼𝗿 𝗮𝗹 𝗰𝗮𝗽𝘁𝘂𝗿𝗮𝗿 𝗹𝗮 𝘄𝗲𝗯.*` }, { quoted: m });
            await m.react('✖️');
        }
    }
};

export default ssCommand;
