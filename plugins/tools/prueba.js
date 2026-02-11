import axios from 'axios';

const translateConfig = {
    name: 'translate',
    alias: ['traducir', 'trt'],
    category: 'tools',
    run: async function (m, { text, args, command }) {
        const MyApiUrl = 'https://script.google.com/macros/s/AKfycbyrAxDGtL-_e8FjIJFIE4kdFK76jZ2rIIHfMtEcRwkdfX3Wz8JLOVfB4OHnCO6Dzism/exec';

        let lang = 'es';
        let targetText = text;

        if (args[0] && args[0].length === 2) {
            lang = args[0];
            targetText = args.slice(1).join(' ');
        }

        if (!targetText && m.quoted) targetText = m.quoted.text;
        
        if (!targetText) return m.reply(`> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ.\n> ᴇᴊ: ${m.prefix}${command} en hello`);

        try {
            const res = await axios.get(`${MyApiUrl}?text=${encodeURIComponent(targetText)}&to=${lang}`);
            
            if (res.data && res.data.status) {
                let response = `> ┏━━━〔 ᴛʀᴀᴅᴜᴄᴄɪᴏɴ 〕━━━┓\n`;
                response += `> ┃ ✎ ʀᴇsᴜʟᴛᴀᴅᴏ: ${res.data.result}\n`;
                response += `> ┗━━━━━━━━━━━━━━━━━━┛`;
                return m.reply(response);
            } else {
                return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ʟᴀ ᴀᴘɪ ɴᴏ ᴘᴜᴅᴏ ᴘʀᴏᴄᴇsᴀʀ ᴇʟ ᴛᴇxᴛᴏ.');
            }
        } catch (e) {
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ғᴀʟʟᴏ ʟᴀ ᴄᴏɴᴇxɪᴏɴ ᴄᴏɴ ɢᴏᴏɢʟᴇ sᴄʀɪᴘᴛ.');
        }
    }
};

export default translateConfig;
