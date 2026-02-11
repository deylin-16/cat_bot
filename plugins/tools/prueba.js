import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const qrDeylinConfig = {
    name: 'qr',
    alias: ['codigoqr', 'qricon'],
    category: 'tools',
    run: async function (m, { conn, text }) {
        const logoUrl = 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770845615398_catbot_icon_1770845600768_Zj7f5rIDX.png';
        
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        let qrData = text;

        if (/image/.test(mime)) {
            m.reply('> ⏳ ᴘʀᴏᴄᴇsᴀɴᴅᴏ ɪᴍᴀɢᴇɴ...');
            try {
                let media = await q.download();
                const { ext } = await fileTypeFromBuffer(media);
                
                // Subida manual a Telegra.ph vía API
                const form = new FormData();
                form.append('file', media, { filename: `file.${ext}` });
                
                const { data } = await axios.post('https://telegra.ph/upload', form, {
                    headers: { ...form.getHeaders() }
                });
                
                qrData = 'https://telegra.ph' + data[0].src;
            } catch (err) {
                return m.reply('> ┃ ✎ ᴇʀʀᴏʀ ᴀʟ sᴜʙɪʀ ɪᴍᴀɢᴇɴ.');
            }
        } 

        if (!qrData) return m.reply(`> ✎ ɪɴғᴏ: ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴏ ᴇsᴄʀɪʙᴇ ᴜɴ ᴛᴇxᴛᴏ.`);

        const qrFinalUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=600&centerImageUrl=${encodeURIComponent(logoUrl)}&centerImageSize=0.2&margin=2`;

        try {
            await conn.sendMessage(m.chat, { 
                image: { url: qrFinalUrl }, 
                caption: `> ✅ ǫʀ ɢᴇɴᴇʀᴀᴅᴏ ᴄᴏɴ ᴇxɪᴛᴏ\n> 👤 ʙʏ: ᴅᴇʏʟɪɴ ᴛᴇᴄʜ\n> 🔗 ᴄᴏɴᴛᴇɴɪᴅᴏ: ${qrData}` 
            }, { quoted: m });
        } catch (e) {
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ ᴀʟ ɢᴇɴᴇʀᴀʀ ǫʀ.');
        }
    }
};

export default qrDeylinConfig;
