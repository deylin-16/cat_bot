import axios from 'axios';
import pkg from 'telegra.ph';
const { uploadByBuffer } = pkg;

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
            m.reply('> ⏳ ᴘʀᴏᴄᴇsᴀɴᴅᴏ ɪᴍᴀɢᴇɴ ʏ ɢᴇɴᴇʀᴀɴᴅᴏ ǫʀ...');
            let media = await q.download();
            // Ahora uploadByBuffer funcionará correctamente
            qrData = await uploadByBuffer(media, 'image/png');
        } 

        if (!qrData) return m.reply(`> ✎ ɪɴғᴏ: ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴏ ᴇsᴄʀɪʙᴇ ᴜɴ ᴛᴇxᴛᴏ ᴘᴀʀᴀ ᴇʟ ǫʀ.`);

        const qrFinalUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=600&centerImageUrl=${encodeURIComponent(logoUrl)}&centerImageSize=0.2&margin=2`;

        try {
            await conn.sendMessage(m.chat, { 
                image: { url: qrFinalUrl }, 
                caption: `> ✅ ǫʀ ɢᴇɴᴇʀᴀᴅᴏ ᴄᴏɴ ᴇxɪᴛᴏ\n> 👤 ʙʏ: ᴅᴇʏʟɪɴ ᴛᴇᴄʜ\n> 🔗 ᴄᴏɴᴛᴇɴɪᴅᴏ: ${qrData}` 
            }, { quoted: m });
        } catch (e) {
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ɴᴏ sᴇ ᴘᴜᴅᴏ ɢᴇɴᴇʀᴀʀ ᴇʟ ǫʀ.');
        }
    }
};

export default qrDeylinConfig;
