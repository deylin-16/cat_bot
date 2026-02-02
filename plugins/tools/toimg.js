import fs from "fs";
import path from "path";
import sharp from "sharp";

const toimgCommand = {
    name: 'toimg',
    alias: ['img', 'stickerimg'],
    category: 'tools',
    run: async (m, { conn }) => {
        const q = m.quoted ? m.quoted : m;
        try {
            if (!/stickerMessage/i.test(q.mtype)) {
                return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Responde a un sticker.');
            }

            await m.react('⏳');
            let stickerBuffer = await q.download();
            if (!stickerBuffer) return m.reply("❯❯ 𝗘𝗥𝗥𝗢𝗥: Fallo en la descarga.");

            let outPath = path.join(process.cwd(), `temp_${Date.now()}.jpg`);
            await sharp(stickerBuffer).jpeg().toFile(outPath);

            await conn.sendFile(m.chat, outPath, "sticker.jpg", "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Sticker convertido a imagen.", m);

            if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
            await m.react('✅');
        } catch (e) {
            console.error(e);
            m.reply("❯❯ 𝗘𝗥𝗥𝗢𝗥: Fallo en la conversión.");
        }
    }
};

export default toimgCommand;
