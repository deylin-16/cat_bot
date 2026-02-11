import axios from 'axios';

const translateConfig = {
    name: 'translate',
    alias: ['traducir', 'trt'],
    category: 'tools',
    run: async function (m, { text, args, command }) {
        const MyApiUrl = 'https://script.google.com/macros/s/AKfycbyrAxDGtL-_e8FjIJFIE4kdFK76jZ2rIIHfMtEcRwkdfX3Wz8JLOVfB4OHnCO6Dzism/exec';

        // 1. Idioma por defecto: Español
        let lang = 'es';
        let targetText = text;

        // 2. Inteligencia: Si el primer argumento es un código de idioma (2 letras)
        if (args[0] && args[0].length === 2) {
            lang = args[0];
            targetText = args.slice(1).join(' ');
        }

        // 3. Soporte para mensajes citados
        if (!targetText && m.quoted) targetText = m.quoted.text;
        
        if (!targetText) return m.reply(`> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ ᴏ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴ ᴍᴇɴsᴀᴊᴇ.\n> ᴇᴊ: ${m.prefix}${command} hello\n> ᴇᴊ: ${m.prefix}${command} en hola`);

        try {
            const res = await axios.get(`${MyApiUrl}?text=${encodeURIComponent(targetText)}&to=${lang}`);
            
            if (res.data && res.data.status) {
                let response = `> ┏━━━〔 ᴛʀᴀᴅᴜᴄᴄɪᴏɴ 〕━━━┓\n`;
                response += `> ┃ ✎ ᴅᴇsᴛɪɴᴏ: ${lang.toUpperCase()}\n`;
                response += `> ┃ ✎ ʀᴇsᴜʟᴛᴀᴅᴏ: ${res.data.result}\n`;
                response += `> ┗━━━━━━━━━━━━━━━━━━┛`;
                return m.reply(response);
            } else {
                return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ʟᴀ ᴀᴘɪ ɴᴏ ᴘᴜᴅᴏ ᴘʀᴏᴄᴇsᴀʀ ᴇʟ ᴛᴇxᴛᴏ.');
            }
        } catch (e) {
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ғᴀʟʟᴏ ʟᴀ ᴄᴏɴᴇxɪᴏɴ ᴄᴏɴ ᴛᴜ sᴇʀᴠɪᴅᴏʀ ɢᴏᴏɢʟᴇ.');
        }
    }
};

export default translateConfig;
