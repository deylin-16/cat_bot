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
        if (!targetText) return m.reply(`> ✎ ᴜsᴏ: ${command} [iso] [texto]`);

        try {
            const res = await axios.get(`${MyApiUrl}?text=${encodeURIComponent(targetText)}&to=${lang}`);
            const data = res.data;

            if (data.status) {
                let response = `> ┏━━━〔 ᴛʀᴀᴅᴜᴄᴄɪᴏɴ ᴘʀɪᴠᴀᴅᴀ 〕━━━┓\n`;
                response += `> ┃ ✎ ʀᴇsᴜʟᴛᴀᴅᴏ: ${data.result}\n`;
                response += `> ┗━━━━━━━━━━━━━━━━━━┛`;
                return m.reply(response);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ᴛᴜ ᴀᴘɪ ɴᴏ ʀᴇsᴘᴏɴᴅɪᴏ.');
        }
    }
};

export default translateConfig;
