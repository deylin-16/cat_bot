import translate from 'google-translate-api-next';

const translateConfig = {
    name: 'translate',
    alias: ['traducir', 'trt'],
    category: 'tools',
    run: async function (m, { text, args, command }) {
        let lang = 'es';
        let targetText = text;

        if (args[0] && args[0].length === 2) {
            lang = args[0];
            targetText = args.slice(1).join(' ');
        }

        if (!targetText && m.quoted && m.quoted.text) {
            targetText = m.quoted.text;
        }

        if (!targetText) return m.reply(`> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ ᴏ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴ ᴍᴇɴsᴀᴊᴇ.\n> ᴜsᴏ: ${command} [iso] [texto]\n> ᴇᴊ: ${command} en hola`);

        try {
            const result = await translate(targetText, { to: lang });
            let response = `> ┏━━━〔 ᴛʀᴀᴅᴜᴄᴄɪᴏɴ 〕━━━┓\n`;
            response += `> ┃ ✎ ᴏʀɪɢᴇɴ: ${result.from.language.iso}\n`;
            response += `> ┃ ✎ ᴅᴇsᴛɪɴᴏ: ${lang}\n`;
            response += `> ┃ ✎ ʀᴇsᴜʟᴛᴀᴅᴏ: ${result.text}\n`;
            response += `> ┗━━━━━━━━━━━━━━━━━━┛`;
            
            return m.reply(response);
        } catch (e) {
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: sᴇʀᴠɪᴄɪᴏ ɴᴏ ᴅɪsᴘᴏɴɪʙʟᴇ.');
        }
    }
};

export default translateConfig;
