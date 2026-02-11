import fetch from 'node-fetch';

const shortCommand = {
    name: 'short',
    alias: ['acortar', 'link', 'corta'],
    category: 'tools',
    run: async (m, { text }) => {
        const googleApiUrl = 'https://script.google.com/macros/s/AKfycbzadF8bdYBYo6OAse0cZe7r__ahnot6HhujP_ZmbQlWgKz84VS7ahsXQzEkGiJgKoZ5/exec';

        if (!text) return m.reply('> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴇɴʟᴀᴄᴇ.');

        try {
            await m.react('🕓');
            
            const res = await fetch(`${googleApiUrl}?url=${encodeURIComponent(text)}`, {
                method: 'POST'
            });
            const json = await res.json();

            if (json.status) {
                const shortUrl = `${googleApiUrl}?id=${json.id}`;
                
                let txt = `> 🔗 *ᴇɴʟᴀᴄᴇ ᴀᴄᴏʀᴛᴀᴅᴏ*\n\n`;
                txt += `> ✧ *ᴏʀɪɢɪɴᴀʟ:* ${text}\n`;
                txt += `> ✧ *ᴄᴏʀᴛᴏ:* ${shortUrl}\n\n`;
                txt += `> 👤 *sɪsᴛᴇᴍᴀ:* ᴅᴇʏʟɪɴ ᴛᴇᴄʜ\n`;
                txt += `> ☁️ *ɪɴғᴏ:* ʟᴀ ɪɴғᴏʀᴍᴀᴄɪᴏɴ sᴇ ʜᴀ ɢᴜᴀʀᴅᴀᴅᴏ ᴇɴ ʟᴀ ʙᴀsᴇ ᴅᴇ ᴅᴀᴛᴏs ᴅᴇ ɢᴏᴏɢʟᴇ sʜᴇᴇᴛs.`;

                await m.reply(txt);
                await m.react('✅');
            }
        } catch (e) {
            await m.react('✖️');
            m.reply('> ⚔ ᴇʀʀᴏʀ ᴅᴇ ᴄᴏɴᴇxɪᴏɴ.');
        }
    }
};

export default shortCommand;
