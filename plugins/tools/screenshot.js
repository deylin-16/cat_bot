import fetch from 'node-fetch';

const ssCommand = {
    name: 'ss',
    alias: ['screenshot', 'captura', 'web'],
    category: 'tools',
    run: async (m, { conn, args }) => {
        let link = args[0];

        if (!link) {
            return conn.sendMessage(m.chat, { text: `> ╰❑ *𝗜𝗻𝗴𝗿𝗲𝘀𝗲 𝗲𝗹 𝗲𝗻𝗹𝗮𝗰𝗲 𝗱𝗲 𝘂𝗻𝗮 𝗽𝗮́𝗴𝗶𝗻𝗮 𝘄𝗲𝗯.*` }, { quoted: m });
        }

        if (!/^https?:\/\//.test(link)) link = 'https://' + link;

        try {
            await m.react('⌛');
            
            const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(link)}&screenshot=true`;
            const response = await fetch(apiUrl);
            const json = await response.json();

            if (!json.lighthouseResult?.audits?.['final-screenshot']?.details?.data) {
                throw new Error('No se pudo generar la captura.');
            }

            const base64Data = json.lighthouseResult.audits['final-screenshot'].details.data.replace(/^data:image\/jpeg;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            await conn.sendFile(m.chat, buffer, 'ss.jpg', `> ✎ *𝗖𝗮𝗽𝘁𝘂𝗿𝗮 𝗱𝗲:* ${link}`, m);
            await m.react('✅');

        } catch (err) {
            console.error(err);
            await conn.sendMessage(m.chat, { text: `> ⍰ *𝗘𝗿𝗿𝗼𝗿 𝗮𝗹 𝗰𝗮𝗽𝘁𝘂𝗿𝗮𝗿 𝗹𝗮 𝘄𝗲𝗯.*` }, { quoted: m });
            await m.react('✖️');
        }
    }
};

export default ssCommand;
