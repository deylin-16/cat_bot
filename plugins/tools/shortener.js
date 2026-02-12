import fetch from 'node-fetch';

const shortCommand = {
    name: 'short',
    alias: ['acortar', 'link', 'corta'],
    category: 'tools',
    run: async (m, { text }) => {
        const apiVercel = 'https://deylin.xyz/api/short';

        if (!text) return m.reply('> ✎ ɪɴғᴏ: ɪɴɢʀᴇsᴀ ᴇʟ ᴇɴʟᴀᴄᴇ.');

        try {
            await m.react('🕓');

            const res = await fetch(apiVercel, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: text })
            });
            
            const json = await res.json();

            if (json.status) {
                const shortUrl = `https://deylin.xyz/${json.id}`;

                let txt = `> 🔗 *ᴇɴʟᴀᴄᴇ ᴀᴄᴏʀᴛᴀᴅᴏ*\n\n`;
                txt += `> ✧ *ᴏʀɪɢɪɴᴀʟ:* ${text}\n`;
                txt += `> ✧ *ᴄᴏʀᴛᴏ:* ${shortUrl}\n\n`;
                txt += `> ☁️ *ɪɴғᴏ:* ʟᴀ ɪɴғᴏʀᴍᴀᴄɪᴏɴ sᴇ ʜᴀ ɢᴜᴀʀᴅᴀᴅᴏ ᴇɴ ʟᴀ ʙᴀsᴇ ᴅᴇ ᴅᴀᴛᴏs ᴅᴇ ʟᴀ ʀᴇᴅ ᴢ .`;

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
