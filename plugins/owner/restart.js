const restartCommand = {
    name: 'restart',
    alias: ['reiniciar', 'reboot'],
    category: 'owner',
    run: async (m, { conn, isROwner }) => {
        
        if (!isROwner) return;

        try {
            await m.reply(`*── 「 REINICIO DEL SISTEMA 」 ──*\n\n▢ *ESTADO:* Reiniciando servidor...\n▢ *TIEMPO:* ~2 segundos\n\n_Espere un momento por favor._`);
            
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (conn.ws.readyState === 1) { 
                await conn.logout().catch(() => {});
            }

            process.exit(0);
            
        } catch (error) {
            console.error(error);
            conn.reply(m.chat, `❌ *ERROR CRÍTICO DURANTE EL REINICIO*\n\n*LOG:* ${error.message}`, m);
        }
    }
};

export default restartCommand;
