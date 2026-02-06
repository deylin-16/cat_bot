import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
import { join } from 'path';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const execPromise = promisify(exec);

const ttsCommand = {
    name: 'tts',
    alias: ['voz', 'decir'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        if (!text) return;

        const id = Math.floor(Math.random() * 10000);
        const input = join('./', `input_${id}.mp3`);
        const output = join('./', `output_${id}.opus`);

        try {
            await m.react('🗣️');

            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;
            
            const { data } = await axios({
                method: 'get',
                url,
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            await writeFile(input, data);

            await execPromise(`ffmpeg -i ${input} -c:a libopus -b:a 32k -vbr on -compression_level 10 ${output}`);

            const buffer = await readFile(output);

            await conn.sendMessage(m.chat, { 
                audio: buffer, 
                mimetype: 'audio/ogg; codecs=opus', 
                ptt: true 
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            console.error(error);
            await m.react('❌');
        } finally {
            if (fs.existsSync(input)) await unlink(input);
            if (fs.existsSync(output)) await unlink(output);
        }
    }
};

export default ttsCommand;
