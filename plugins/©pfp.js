let handler = async (m, { conn, args, text }) => {
    let mentionedJid = m.mentionedJid;
    let who;

    if (m.quoted?.sender) {
        who = m.quoted.sender;
    } else if (mentionedJid?.[0]) {
        who = mentionedJid[0];
    } else if (args[0]) {
        let number = args[0].replace(/[^0-9]/g, '');
        if (number) {
            who = number + '@s.whatsapp.net';
        }
    }

    if (!who) {
        return conn.sendMessage(m.chat, {
            text: 'Dime a quien quieras robar su foto de perfil  w.'
        }, {
            quoted: m
        });
    }

    let name = await (async () => {
        const dbName = global.db.data.users[who]?.name;
        if (dbName) return dbName;
        try {
            const contactName = await conn.getName(who);
            return (typeof contactName === 'string' && contactName.trim()) ? contactName : who.split('@')[0];
        } catch {
            return who.split('@')[0];
        }
    })();

    await m.react('🕒');

    let pp;
    try {
        pp = await conn.profilePictureUrl(who, 'image');
    } catch {
        try {
            pp = await conn.profilePictureUrl(m.chat, 'image');
            await conn.sendMessage(m.chat, { text: ` *Solo tengo la foto del grupo.*` }, { quoted: m });
        } catch {
            pp = 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg';
            await conn.sendMessage(m.chat, { text: `*No encontré nada w.*` }, { quoted: m });
        }
    }

    await conn.sendFile(m.chat, pp, 'profile.jpg', `*Aquí tienes la foto de perfil de ${name}*`, m);
    await m.react('✔️');
};

handler.customPrefix = /^(robar fotos de perfil|tomar perfil|obtener foto)/i;
handler.command = new RegExp;

handler.all = async function (m) {
    if (!m.text) return;
    const triggers = ['robar fotos de perfil', 'tomar perfil', 'obtener foto'];
    if (triggers.some(phrase => m.text.toLowerCase() === phrase.toLowerCase())) {
       // this.sendMessage(m.chat, { text: 'Dime a quien quieras robar su foto de perfil  w.' }, { quoted: m });
    }
};

export default handler;
