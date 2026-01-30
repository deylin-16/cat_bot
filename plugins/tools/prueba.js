const cardCommand = {
    name: 'carta',
    alias: ['card', 'cardgen', 'post'],
    category: 'tools',
    run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) {
            const menu = `┏━━━〔 ᴄᴀʀᴅ sʏsᴛᴇᴍ 〕━━━┓
┃
┃ ➠ ᴜsᴏ: ${usedPrefix + command} <ᴛᴇxᴛᴏ>|<ɴᴜᴍ>
┃ ➠ ᴇᴊ: ${usedPrefix + command} Hola|2
┃
┣━━〔 ᴇsᴛɪʟᴏs ᴅɪsᴘᴏɴɪʙʟᴇs 〕━━┓
┃
┃ ⋆͙̈ 1. Dark Premium
┃ ⋆͙̈ 2. Cyberpunk Tech
┃ ⋆͙̈ 3. Ancient Paper
┃ ⋆͙̈ 4. Hacker Terminal
┃ ⋆͙̈ 5. Glassmorphism
┃ ⋆͙̈ 6. Romantic Love
┃ ⋆͙̈ 7. Modern Soft
┃
┗━━━━━━━━━━━━━━━━━━━━┛`;
            return m.reply(menu);
        }

        await m.react('⏳');

        try {
            let [txt, type] = text.split('|');
            const style = type ? type.trim() : '1';
            const author = m.pushName || 'Deylin System';
            const apiUrl = `https://api.deylin.xyz/api/ai/card?text=${encodeURIComponent(txt.trim())}&author=${encodeURIComponent(author)}&type=${style}`;

            await conn.sendMessage(m.chat, { 
                image: { url: apiUrl }, 
                caption: `┏━━━〔 ᴄᴀʀᴅ ɢᴇɴ 〕━━━┓\n┃ ✎ ᴇsᴛɪʟᴏ: ${style}\n┃ ✎ ᴜsᴜᴀʀɪᴏ: @${m.sender.split('@')[0]}\n┃ ✎ ᴄᴏᴘʏʀɪɢʜᴛ: ᴅᴇʏʟɪɴ sʏsᴛᴇᴍ\n┗━━━━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender]
            }, { quoted: m });

            await m.react('✅');
        } catch (e) {
            console.error(e);
            await m.react('❌');
            m.reply(`┏━━━〔 ᴇʀʀᴏʀ 〕━━━┓\n┃ ✎ ɪɴғᴏ: ғᴀʟʟᴏ ᴀʟ ɢᴇɴᴇʀᴀʀ ɪᴍᴀɢᴇɴ\n┗━━━━━━━━━━━━━━━┛`);
        }
    }
}

export default cardCommand;
