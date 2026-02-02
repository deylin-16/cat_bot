import fetch from 'node-fetch';

const ytSearchCommand = {
    name: 'ytsearch',
    alias: ['yts', 'buscar'],
    category: 'search',
    run: async (m, { conn, text, command }) => {
        if (!text) return m.reply(`❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .${command} [término de búsqueda]\nEjemplo: .${command} phillip ryan`);

        try {
            await m.react('🔍');
            
            const response = await fetch(`https://ytumode-api.vercel.app/api/search?q=${encodeURIComponent(text)}`);
            const data = await response.json();

            if (!data.status || !data.resultado || data.resultado.length === 0) {
                return m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: No se detectaron resultados para "${text}".`);
            }

            const resultados = data.resultado.slice(0, 8); 
            let mensaje = `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n❖ 𝗕𝗨𝗦𝗤𝗨𝗘𝗗𝗔: ${text.toUpperCase()}\n❖ 𝗥𝗘𝗦𝗨𝗟𝗧𝗔𝗗𝗢𝗦: ${resultados.length}\n\n`;

            for (let vid of resultados) {
                mensaje += `❒─── 「 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 」 ───\n`;
                mensaje += `❖ 𝗧𝗜𝗧𝗨𝗟𝗢: ${vid.titulo}\n`;
                mensaje += `❖ 𝗖𝗔𝗡𝗔𝗟: ${vid.canal}\n`;
                mensaje += `❖ 𝗗𝗨𝗥𝗔𝗖𝗜𝗢𝗡: ${vid.duracion}\n`;
                mensaje += `❖ 𝗩𝗜𝗦𝗧𝗔𝗦: ${vid.vistas.toLocaleString()}\n`;
                mensaje += `❖ 𝗘𝗡𝗟𝗔𝗖𝗘: ${vid.url}\n\n`;
            }

            mensaje += `❯❯ 𝗗𝗘𝗬𝗟𝗜𝗡 𝗦𝗬𝗦𝗧𝗘𝗠 - 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡`;

            await conn.sendMessage(m.chat, { 
                text: mensaje.trim(),
                contextInfo: {
                    externalAdReply: {
                        title: "𝗬𝗢𝗨𝗧𝗨𝗕𝗘 𝗦𝗘𝗔𝗥𝗖𝗛",
                        body: `Resultados para: ${text}`,
                        mediaType: 1,
                        thumbnailUrl: "https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1768838597942_CHk6Hpv5C.jpeg",
                        renderLargerThumbnail: false,
                        sourceUrl: "https://www.youtube.com"
                    }
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥 𝗖𝗥𝗜𝗧𝗜𝗖𝗢: No se pudo procesar la solicitud.`);
        }
    }
};

export default ytSearchCommand;
