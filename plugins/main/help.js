import { promises } from 'fs';
import { join } from 'path';

const menuCommand = {
    name: 'menu',
    alias: ['help', 'menu', 'comandos'],
    category: 'main',
    run: async (m, { conn, usedPrefix }) => {
        try {
            let userId = m.sender;
            let totalCommands = Object.keys(global.plugins || {}).length;
            let totalreg = Object.keys(global.db?.data?.users || {}).length;
            let uptime = clockString(process.uptime() * 1000);
            
            const users = [...new Set(
                (global.conns || []).filter(c => 
                    c.user && c.ws?.socket?.readyState !== 3 
                )
            )];

            let menuText = `╭━〘 ${name()} ☆ 〙━⌬
┃ ✎ Nombre: @${userId.split('@')[0]}
┃ ✎ Tipo: ${(conn.user.jid == global.conn?.user?.jid ? 'Principal 🅥' : 'Prem Bot 🅑')}
┃ ✎ Usuarios: ${totalreg}
┃ ✎ Uptime: ${uptime}
┃ ✎ Comandos: ${totalCommands}
┃ ✎ Sub-Bots: ${users.length}
╰━━━━━━━━━━━━━━━━━━━━━⌬\n\n`;

            menuText += `${rmr} \n

*┏━━『 𝐌𝐀𝐈𝐍 』*
*┃ ▣* .menu
*┃ ▣* .bots
*┃ ▣* .code
*┗━━━━━━━━━━━━━*

*┏━━『 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 』*
*┃ ▣* .play 
*┃ ▣* .play2
*┃ ▣* .facebook/fb
*┃ ▣* .instagram/ig
*┃ ▣* .tiktok/tt
*┗━━━━━━━━━━━━━*

*┏━━『 𝐀𝐍𝐈𝐌𝐄 』*
*┃ ▣* .anime
*┃ ▣* .kill/matar 
*┃ ▣* .kiss/beso
*┃ ▣* .kiss2/beso2
*┃ ▣* .hug/abrazo
*┃ ▣* .hello/hola/hi
*┃ ▣* .coffee/café
*┃ ▣* .angry/enojado
*┃ ▣* .happy/feliz 
*┃ ▣* .das/triste
*┃ ▣* .slap/bofetada
*┃ ▣* .laugh/reir 
*┗━━━━━━━━━━━━━*

*┏━━『 𝐈𝐀 』*
*┃ ▣* .imgg
*┃ ▣* .ia
*┃ ▣* .chatgpt
*┃ ▣* .cat/gato
*┗━━━━━━━━━━━━━*

*┏━━『 𝐆𝐑𝐎𝐔𝐏 』*
*┃ ▣* .antisub
*┃ ▣* .config_group
*┃ ▣* .hidetag
*┃ ▣* .setwelcome
*┃ ▣* .todos
*┃ ▣* .setpp
*┃ ▣* .setname
*┃ ▣* .setdesc 
*┃ ▣* .delwelcome
*┃ ▣* .welcome on/off 
*┃ ▣* .detect on/off
*┃ ▣* .kick 
*┃ ▣* .cerrargrupo/cerrargrupo
*┃ ▣* .open/close 
*┃ ▣* .abrir/cerrar
*┃ ▣* .recordatorio 
*┃ ▣* .mute/unmute
*┗━━━━━━━━━━━━━*

*┏━━『 𝐒𝐓𝐈𝐂𝐊𝐄𝐑𝐒 』*
*┃ ▣* .s
*┃ ▣* .sticker
*┗━━━━━━━━━━━━━*

*┏━━ 『 𝐎𝐖𝐍𝐄𝐑 』*
*┃ ▣* .await 
*┃ ▣* .restart
*┃ ▣* .ds
*┗━━━━━━━━━━━━━*

*┏━━ 『 𝐒𝐄𝐀𝐑𝐂𝐇 』*
*┃ ▣* .pinterest 
*┃ ▣* .ttss
*┃ ▣* .gif
*┃ ▣* .ytsearch 
*┗━━━━━━━━━━━━━*

*┏━━ 『 𝐓𝐎𝐎𝐋𝐒 』*
*┃ ▣* .get
*┃ ▣* .sticker
*┃ ▣* .upload 
*┃ ▣* .meme
*┃ ▣* .whatmusic
*┃ ▣* .pfp 
*┃ ▣* .reducir 
*┃ ▣* .sa/ssweb
*┗━━━━━━━━━━━━━*
`;

            await conn.sendMessage(m.chat, { 
                text: menuText,
                contextInfo: {
                    mentionedJid: [userId],
                    externalAdReply: {
                        title: `\t\t\t\t\t\t\t\t${name()}`,
                        thumbnailUrl: global.img() || '', 
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            await m.react('📜');

        } catch (error) {
            console.error(error);
            conn.reply(m.chat, 'Error al generar el menú.', m);
        }
    }
};

export default menuCommand;

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}
