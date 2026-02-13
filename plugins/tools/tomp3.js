import { exec } from 'child_process';
import fs from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const tomp3Command = {
    name: 'tomp3',
    alias: ['toaudio', 'tomp3_2'],
    category: 'convert',
    run: async (m, { conn }) => {
        try {
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';

            if (!/video/.test(mime)) return m.reply('> ✎ Responde a un *video*.');

            await m.react('🕓');

            let buffer = await q.download();
            if (!buffer) return m.reply('> ⚔ Error al obtener buffer.');

            const tempVideo = join(tmpdir(), `v_${Date.now()}.mp4`);
            const tempAudio = join(tmpdir(), `a_${Date.now()}.mp3`);

            fs.writeFileSync(tempVideo, buffer);

            exec(`ffmpeg -i ${tempVideo} -vn -acodec libmp3lame -ab 128k ${tempAudio}`, async (err) => {
                if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);

                if (err) {
                    await m.react('✖️');
                    return m.reply('> ⚔ Error en conversión.');
                }

                const audioBuffer = fs.readFileSync(tempAudio);

                await conn.sendMessage(m.chat, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mp4', 
                    ptt: false 
                }, { quoted: m });

                await m.react('✅');

                if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
            });

        } catch (e) {
            await m.react('✖️');
            m.reply(`> ⚔ Error: ${e.message}`);
        }
    }
};

export default tomp3Command;
