let handler = async (m, { conn, text, command, isROwner, isOwner }) => {
    const botId = conn.user.jid;
    global.db.data.settings[botId] ||= { prefix: ['.', '#', '/'] };

    if (command === 'setprefix') {
        if (!text) return m.reply(`*⚠️ Ingrese los prefijos deseados separándolos por espacio.*\n*Ejemplo:* #setprefix . # ! (Máximo 3)`);
        
        let newPrefixes = text.split(/\s+/).filter(v => v.length > 0);
        if (newPrefixes.length > 3) return m.reply(`*❌ Solo puedes establecer un máximo de 3 prefijos.*`);
        
        global.db.data.settings[botId].prefix = newPrefixes;
        m.reply(`*✅ Prefijos actualizados para esta instancia:* ${newPrefixes.join(' ')}`);
    }

    if (command === 'resetprefix') {
        global.db.data.settings[botId].prefix = ['.', '#', '/'];
        m.reply(`*✅ Prefijos reseteados a los valores por defecto:* . # /`);
    }
}

handler.help = ['setprefix', 'resetprefix'];
handler.tags = ['owner', 'subbot'];
handler.command = /^(setprefix|resetprefix)$/i;
handler.owner = true; 

export default handler;
