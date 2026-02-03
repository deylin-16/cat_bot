import { SocialMediaScraper } from 'social-media-scraper';

const scraper = new SocialMediaScraper();

const socialCommand = {
    name: 'instagram',
    alias: ['descarga'],
    category: 'descargas',
    run: async (m, { conn, args, command }) => {
        if (!args[0]) return m.reply(`❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .${command} [enlace]`);

        const isIG = /instagram\.com|instagr\.am/i.test(args[0]);
        const isFB = /facebook\.com|fb\.watch/i.test(args[0]);

        if (!isIG && !isFB) return m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: Enlace no compatible.`);

        try {
            await m.react("⏳");

            const result = await scraper.download(args[0]);
            if (!result.success) throw new Error(result.error);

            const { metadata, buffer } = result;
            
            let caption = `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n`;
            caption += `❖ 𝗣𝗟𝗔𝗧𝗔𝗙𝗢𝗥𝗠𝗔: ${metadata.platform.toUpperCase()}\n`;
            caption += `❖ 𝗨𝗦𝗨𝗔𝗥𝗜𝗢: ${metadata.username || metadata.pageName || 'Privado'}\n`;
            
            if (metadata.likes) caption += `❖ 𝗟𝗜𝗞𝗘𝗦: ${metadata.likes.toLocaleString()}\n`;
            if (metadata.duration) caption += `❖ 𝗗𝗨𝗥𝗔𝗖𝗜𝗢𝗡: ${metadata.duration}s\n`;
            if (metadata.caption) caption += `\n❖ 𝗧𝗘𝗫𝗧𝗢: ${metadata.caption.slice(0, 150)}...\n`;

            await conn.sendMessage(m.chat, { 
                video: buffer, 
                caption: caption.trim(),
                mimetype: 'video/mp4'
            }, { quoted: m });

            await m.react("✅");
        } catch (e) {
            console.error(e);
            await m.react("❌");
            m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥 𝗖𝗥𝗜𝗧𝗜𝗖𝗢: No se pudo procesar el contenido.`);
        }
    }
}

export default socialCommand;
