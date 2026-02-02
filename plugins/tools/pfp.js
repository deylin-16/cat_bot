const pfpCommand = {
    name: 'pfp',
    alias: ['pfp', 'perfil'],
    category: 'tools',
    run: async (m, { conn, text }) => {
        const who = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.sender);

        try {
            const name = await conn.getName(who);
            const pp = await conn.profilePictureUrl(who, 'image').catch(() => 'https://files.catbox.moe/9y329o.jpg');

            await conn.sendMessage(m.chat, { 
                image: { url: pp }, 
                caption: `*Foto de perfil de:* ${name}` 
            }, { quoted: m });
            
        } catch (e) {
            console.error(e);
        }
    }
};

export default pfpCommand;
