import axios from 'axios';

const linkCommand = {
    name: 'link',
    alias: ['enlace', 'link'],
    category: 'group',
    group: true,
    run: async (m, { conn }) => {
        if (!m.isGroup || !m.botAdmin) return;
        try {
            const groupMetadata = await conn.groupMetadata(m.chat);
            const inviteCode = await conn.groupInviteCode(m.chat);
            const mainLink = `https://chat.whatsapp.com/${inviteCode}`;

            let shortLink;
            try {
                const { data } = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(mainLink)}`);
                shortLink = data;
            } catch {
                shortLink = 'No disponible';
            }

            const caption = `*─── 「 ENLACE DE GRUPO 」 ───*\n\n▢ *GRUPO:* ${groupMetadata.subject}\n▢ *MIEMBROS:* ${groupMetadata.participants.length}\n▢ *CREADOR:* @${groupMetadata.owner?.split('@')[0] || 'Desconocido'}\n\n▢ *ENLACE PRINCIPAL:*\n• ${mainLink}\n\n▢ *ENLACE CORTO:*\n• ${shortLink}\n\n*──────────────────────────*`.trim();

            await conn.sendMessage(m.chat, {
                text: caption,
                contextInfo: {
                    mentionedJid: [groupMetadata.owner],
                    externalAdReply: {
                        title: 'INVITACIÓN OFICIAL',
                        body: groupMetadata.subject,
                        mediaType: 1,
                        sourceUrl: mainLink,
                        thumbnailUrl: await conn.profilePictureUrl(m.chat, 'image').catch(() => null),
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });
        } catch (e) {
            console.error(e);
        }
    }
};

export default linkCommand;
