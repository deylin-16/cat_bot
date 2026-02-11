import translate from 'google-translate-api-next';

const translateConfig = {
    name: 'translate',
    alias: ['traducir', 'trt'],
    category: 'tools',
    run: async function (m, { text, args, command }) {
        let lang = 'es';
        let targetText = text;

        // Si usas: .traducir en hello -> args[0] es 'en', el resto es el texto
        if (args[0] && args[0].length === 2) {
            lang = args[0];
            targetText = args.slice(1).join(' ');
        }

        // Si respondes a un mensaje: .traducir en (y el mensaje tiene texto)
        if (!targetText && m.quoted && m.quoted.text) {
            targetText = m.quoted.text;
        }

        if (!targetText) return m.reply(`> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴛᴇxᴛᴏ.\n> ᴜsᴏ: ${command} [iso] [texto]\n> ᴇᴊ: ${command} en hola`);

        try {
            // Se añade un timeout para que no se quede colgado
            const result = await translate(targetText, { to: lang }).catch(err => {
                console.error(err);
                return null;
            });

            if (!result) throw new Error('No result');

            let response = `> ┏━━━〔 ᴛʀᴀᴅᴜᴄᴄɪᴏɴ 〕━━━┓\n`;
            response += `> ┃ ✎ ᴏʀɪɢᴇɴ: ${result.from.language.iso}\n`;
            response += `> ┃ ✎ ᴅᴇsᴛɪɴᴏ: ${lang}\n`;
            response += `> ┃ ✎ ʀᴇsᴜʟᴛᴀᴅᴏ: ${result.text}\n`;
            response += `> ┗━━━━━━━━━━━━━━━━━━┛`;
            
            return m.reply(response);
        } catch (e) {
            
            console.log("Error en Traductor:", e.message);
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ɢᴏᴏɢʟᴇ ᴛʀᴀɴsʟᴀᴛᴇ ɴᴏ ʀᴇsᴘᴏɴᴅɪᴏ.');
        }
    }
};

export default translateConfig;
