import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

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

            let webpPath = path.join(process.cwd(), `tmp/temp_${Date.now()}.webp`);
            let jpgPath = path.join(process.cwd(), `tmp/temp_${Date.now()}.jpg`);

            await fs.promises.writeFile(webpPath, stickerBuffer);

            await execPromise(`ffmpeg -i ${webpPath} ${jpgPath}`);

            const buffer = await fs.promises.readFile(jpgPath);

            await conn.sendMessage(m.chat, { 
                image: buffer, 
                caption: "❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠: Sticker convertido a imagen." 
            }, { quoted: m });

            if (fs.existsSync(webpPath)) await fs.promises.unlink(webpPath);
            if (fs.existsSync(jpgPath)) await fs.promises.unlink(jpgPath);
            
            await m.react('✅');
        } catch (e) {
            console.error(e);
            return conn.sendMessage(m.chat, { text: "❯❯ 𝗘𝗥𝗥𝗢𝗥: Asegúrate de tener ffmpeg instalado." }, { quoted: m });
        }
    }
};

export default toimgCommand;
