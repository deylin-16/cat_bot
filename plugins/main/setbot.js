const antisubPlugin = {
    name: 'antisub',
    alias: ['antisubs'],
    category: 'group',
    rowner: true,
    run: async (m, { conn, text }) => {
        const chat = global.db.data.chats[m.chat];
        if (!text) return m.reply(`*¿Deseas activar o desactivar?*\nUso: .antisub on / off`);

        if (text === 'on') {
            chat.antisub = true;
            await m.reply(`*MODO ANTISUB ACTIVADO*\n\nAhora los sub-bots ignorarán este grupo y solo responderá el bot principal.`);
        } else if (text === 'off') {
            chat.antisub = false;
            await m.reply(`*MODO ANTISUB DESACTIVADO*\n\nLos sub-bots pueden volver a responder en este grupo.`);
        }
    }
};

export default antisubPlugin;
