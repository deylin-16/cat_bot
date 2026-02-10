import fs from "fs";
import path from "path";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Jimp } = require('jimp');

const toimgCommand = {
    name: 'toimg',
    alias: ['img', 'stickerimg'],
    category: 'tools',
    run: async (m, { conn }) => {
        const q = m.quoted ? m.quoted : m;
        try {
            if (!/stickerMessage/i.test(q.mtype)) {
                return conn.sendMessage(m.chat, { text: '❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un sticker.' }, { quoted: m });
            }

            await m.react('⏳');
            let stickerBuffer = await q.download?.();
            if (!stickerBuffer) return conn.sendMessage(m.chat, { text: "❯❯ 𝗘𝗥𝗥𝗢𝗥: Fallo en la descarga." }, { quoted: m });

            const image = await Jimp.read(stickerBuffer);
            const buffer = await image.getBuffer('image/jpeg');

            await conn.sendMessage(m.chat, { 
                image: buffer, 
                caption: "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Sticker convertido a imagen." 
            }, { quoted: m });

            await m.react('✅');
        } catch (e) {
            console.error(e);
            return conn.sendMessage(m.chat, { text: "❯❯ 𝗘𝗥𝗥𝗢𝗥: Fallo en la conversión." }, { quoted: m });
        }
    }
};

export default toimgCommand;
