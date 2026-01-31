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

            menuText += `${rmr} \n*┏━━ 『 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒 』*
*┃ ▣* .facebook
*┃ ▣* .instagram
*┃ ▣* .tiktok
*┗━━━━━━━━━━━━━*

*┏━━『 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 』*
*┃ ▣* .youtube_play
*┗━━━━━━━━━━━━━*

*┏━━『 𝐆𝐑𝐎𝐔𝐏 』*
*┃ ▣* .antisub
*┃ ▣* .config_group
*┃ ▣* .hidetag
*┗━━━━━━━━━━━━━*

*┏━━『 𝐌𝐀𝐈𝐍 』*
*┃ ▣* .menu
*┗━━━━━━━━━━━━━*

*┏━━『 𝐎𝐓𝐑𝐎𝐒 』*
*┃ ▣* .handler
*┃ ▣* .undefined
*┗━━━━━━━━━━━━━*

*┏━━ 『 𝐎𝐖𝐍𝐄𝐑 』*
*┃ ▣* .eval
*┃ ▣* .restart
*┗━━━━━━━━━━━━━*

*┏━━ 『 𝐒𝐄𝐀𝐑𝐂𝐇 』*
*┃   ▣* .pinterest 
*┃   ▣*.tiktokalbum
*┗━━━━━━━━━━━━━*

*┏━━  『 𝐒𝐄𝐑𝐁𝐎𝐓 』*
*┃ ▣* .serbot
*┗━━━━━━━━━━━━━*

*┏━━ 『 𝐓𝐎𝐎𝐋𝐒 』*
*┃ ▣* .get
*┃ ▣*.sticker
*┃ ▣*.upload 
*┗━━━━━━━━━━━━━*

*┏━━━ 『 𝐈𝐍𝐓𝐄𝐑𝐀𝐂𝐂𝐈𝐎𝐍𝐄𝐒 』*
*┃▣*.Kiss/Kiss2/Kiss3
*┃▣*.Beso/Beso2/Beso3
*┃▣*.Hug/Hug2/Abrazo
*┃▣*.Slap/Golpe/Cachetada
*┃▣*.Kill/Matar/Disparar
*┃▣*.Pat/Acariciar/Mimar
*┃▣*.Dance/Bailar/Twerk
*┃▣*.Kick2/Patada/Boxeo
*┃▣*.Laugh/Reir/Llorar_risa
*┃▣*.Wave/Saludo/Desprecio
*┃▣*.Bite/Morder/Lamer
*┃▣*.Sleep/Dormir/Despertar
*┃▣*.Eat/Comer/Ramen/
*┃▣*.Pizza/Burger/Tacos
*┃▣*.Icecream
*┃▣*.Drink/Beber/Coffe/Tea
*┃▣*.Soda/Juice/Water/Beer
*┃▣*.Scare/Asustar/Fear/Beg
*┃▣*.Run/Correr/Viajar/Stare
*┃▣*.Wow/Asombro/Smug/Blush
*┃▣*.Think/Pensar/Confundido
*┃▣*.Smoke/Fumar/Vapear/Candy
*┃▣*.Play/Jugar/Pc/TV/Music
*┃▣*.Hide/Esconderse/Stalk
*┃▣*.Suicide/Suicidio/Lie
*┃▣*.Ignore/Ignorar/Bored
*┃▣*.Clap/Aplaudir/Excited
*┃▣*.Vomit/Vomitar/Sick/Curar
*┃▣*.Cook/Cocinar/Clean/Shop
*┃▣*.Marry/Casar/Divorce
*┃▣*.Study/Estudiar/Write/Read
*┃▣*.Work/Trabajar/Money
*┃▣*.Workout/Ejercicio/Gym
*┃▣*.Shower/Bañarse/Dress
*┃▣*.Fly/Volar/Teleport
*┃▣*.Explode/Burn/Freeze
*┃▣*.Lightning/Summon/Morph
*┃▣*.Heal/Sanar/Protect/Fall
*┃▣*.Fish/Garden/Yoga/Gamble
*┃▣*.Steal/Photo/Record/Stake
*┃▣*.Surf/Ski/Camp/Guitar
*┃▣*.Piano/Sing/Draw/Bike
*┃▣*.Soccer/Basketball/Swim
*┃▣*.Spank/Beso_mano
*┃▣*.Beso_frente/Pillowfight
*┗━━━━━━━━━━━━━━━*`;

            await conn.sendMessage(m.chat, { 
                text: menuText,
                contextInfo: {
                    mentionedJid: [userId],
                    externalAdReply: {
                        title: name(),
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
