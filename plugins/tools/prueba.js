import axios from 'axios';

const qrConfig = {
    name: 'qr',
    alias: ['codigoqr'],
    category: 'tools',
    run: async function (m, { text, conn }) {
        if (!text) return m.reply(`> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ʟɪɴᴋ ᴏ ᴛᴇxᴛᴏ.\n> ᴇᴊ: .qr https://github.com/DeylinTech`);

        // URL de tu logo (asegúrate de que sea un link directo a la imagen)
        const logoUrl = 'https://ik.imagekit.io/pm10ywrf6f/bot_by_deylin/1770845181541_catbot_icon_1770845163396_yTNW-OVi_.png'; 
        
        // Configuramos la API de QuickChart
        const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=500&centerImageUrl=${encodeURIComponent(logoUrl)}&centerImageSize=0.2`;

        try {
            await conn.sendMessage(m.chat, { 
                image: { url: qrUrl }, 
                caption: `> ✅ ǫʀ ɢᴇɴᴇʀᴀᴅᴏ ᴄᴏɴ ᴇxɪᴛᴏ` 
            }, { quoted: m });
        } catch (e) {
            return m.reply('> ┃ ✎ ᴇʀʀᴏʀ: ɴᴏ sᴇ ᴘᴜᴅᴏ ɢᴇɴᴇʀᴀʀ ᴇʟ ǫʀ.');
        }
    }
};

export default qrConfig;
