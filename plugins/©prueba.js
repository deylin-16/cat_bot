import axios from 'axios';

let handler = async (m, { conn }) => {
    try {
        const group = m.chat;
        const groupMetadata = await conn.groupMetadata(group);
        const inviteCode = await conn.groupInviteCode(group);
        const mainLink = `https://chat.whatsapp.com/${inviteCode}`;

        let shortLink;
        try {
            const { data } = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(mainLink)}`);
            shortLink = data;
        } catch {
            shortLink = 'Link corto no disponible';
        }

        const caption = `
  *─── 「 ENLACE DE GRUPO 」 ───*

  ▢ *GRUPO:* ${groupMetadata.subject}
  ▢ *MIEMBROS:* ${groupMetadata.participants.length}
  ▢ *CREADOR:* @${groupMetadata.owner?.split('@')[0] || 'Desconocido'}
  
  ▢ *ENLACE PRINCIPAL:*
  • ${mainLink}

  ▢ *ENLACE CORTO:*
  • ${shortLink}

  *──────────────────────────*`.trim();

        await conn.reply(m.chat, caption, m, {
            contextInfo: {
            mentionedJid: [groupMetadata.owner],
                externalAdReply: {
                    title: 'INVITACIÓN OFICIAL',
                    body: groupMetadata.subject,
                    mediaType: 1,
                    sourceUrl: mainLink,
                    thumbnailUrl: await conn.profilePictureUrl(group, 'image').catch(_ => null),
                    renderLargerThumbnail: false
                }
            }
        });

    } catch (e) {
        m.reply('❌ Error: Verifica que el bot sea administrador.');
    }
};

handler.help = ['link'];
handler.tags = ['grupo'];
handler.command = ['link', 'enlace'];
handler.group = true;
handler.botAdmin = true;

export default handler;
