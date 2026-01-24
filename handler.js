import { smsg } from './lib/message.js';
import { format } from 'util';
import chalk from 'chalk';

const cmdMap = {
    'ping': {
        exec: async (conn, m) => { await m.reply('🚀'); }
    },
    'del': {
        admin: true,
        botAdmin: true,
        exec: async (conn, m) => {
            if (!m.quoted) return;
            await conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
        }
    },
    'code': {
        rowner: true,
        exec: async (conn, m) => {
            const { assistant_accessJadiBot } = await import('./plugins/©acceso.js');
            let code = await assistant_accessJadiBot({ m, conn, phoneNumber: m.sender.split('@')[0], fromCommand: true });
            await m.reply(code);
        }
    }
};

export async function handler(chatUpdate) {
    const conn = this;
    if (!chatUpdate.messages) return;
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m || m.key.remoteJid === 'status@broadcast') return;

    try {
        m = await smsg(conn, m);
        if (!m.isCmd) return;

        const cmd = cmdMap[m.command];
        if (cmd) {
            // Verificaciones de Seguridad Express
            if (cmd.rowner && !m.isROwner) return m.reply('Solo mi creador Deylin puede usar esto.');
            if (cmd.group && !m.isGroup) return m.reply('Este comando es solo para grupos.');
            if (cmd.admin && !m.isAdmin) return m.reply('Necesitas ser admin.');
            if (cmd.botAdmin && !m.isBotAdmin) return m.reply('Necesito ser admin para ejecutar esto.');

            console.log(chalk.cyan(`[COMMAND]`) + ` ${m.command} [${m.sender}]`);
            await cmd.exec(conn, m);
        }
    } catch (e) {
        console.error(e);
        if (m) m.reply(format(e));
    }
}
