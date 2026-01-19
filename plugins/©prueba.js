import axios from 'axios';

let handler = async (m, { conn }) => {
    try {
        const group = m.chat;
        const groupMetadata = await conn.groupMetadata(group);
        const inviteCode = await conn.groupInviteCode(group);
        const mainLink = 'https://chat.whatsapp.com/' + inviteCode;

        let shortLink = mainLink;
        try {
            const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(mainLink)}`);
            shortLink = data;
        } catch {
            shortLink = 'No disponible';
        }

        const caption = `
  *─── 「 ENLACE DE GRUPO 」 ───*

  ▢ *GRUPO:* ${groupMetadata.subject}
  ▢ *MIEMBROS:* ${groupMetadata.participants.length}
  ▢ *CREADOR:* @${groupMetadata.owner?.split('@')[0] || 'Desconocido'}

  ▢ *ENLACE DIRECTO:*
  • ${mainLink}

  ▢ *ENLACE CORTO:*
  • ${shortLink}

  *──────────────────────────*
  _Nota: No comparta el enlace con desconocidos para evitar spam._`.trim();

        await conn.reply(m.chat, caption, m, {
            contextInfo: {
                mentionedJid: [groupMetadata.owner],
                externalAdReply: {
                    title: 'INVITACIÓN AL GRUPO',
                    body: groupMetadata.subject,
                    mediaType: 1,
                    sourceUrl: mainLink,
                    thumbnailUrl: await conn.profilePictureUrl(group, 'image').catch(_ => null),
                    renderLargerThumbnail: false
                }
            }
        });

    } catch (e) {
        m.reply('❌ Error al generar el enlace. Asegúrese de que soy administrador.');
    }
};

handler.help = ['link'];
handler.tags = ['grupo'];
handler.command = ['link', 'enlace'];
handler.group = true;
handler.botAdmin = true;

export default handler;
