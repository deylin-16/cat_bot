import fetch from 'node-fetch';

let recordatorios = {};

const recordatorioCommand = {
    name: 'recordatorio',
    alias: ['cancelarrecordatorio'],
    category: 'group',
    group: true,
    admin: true,
    run: async (m, { conn, args, command, participants }) => {
        if (!m.isGroup || !m.admin) return;
        const chatId = m.chat;

        if (command === 'cancelarrecordatorio') {
            if (recordatorios[chatId]) {
                clearTimeout(recordatorios[chatId].timeout);
                delete recordatorios[chatId];
                return m.reply('*Estatus:* Proceso finalizado.');
            }
            return m.reply('No existen tareas activas.');
        }

        if (args.length < 2) return m.reply('Uso: *.recordatorio [minutos] [repeticiones]*');

        let tiempo = parseInt(args[0]);
        let repeticiones = parseInt(args[1]);
        if (isNaN(tiempo) || tiempo <= 0 || isNaN(repeticiones) || repeticiones <= 0) return m.reply('Números inválidos.');

        const mQuoted = m.quoted ? m.quoted : m;
        if (recordatorios[chatId]) {
            clearTimeout(recordatorios[chatId].timeout);
            delete recordatorios[chatId];
        }

        const res = await fetch('https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1768838597942_CHk6Hpv5C.jpeg');
        const thumb2 = Buffer.from(await res.arrayBuffer());
        const fkontak = { key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "Halo" }, message: { locationMessage: { name: '𝗥𝗘𝗖𝗢𝗥𝗗𝗔𝗧𝗢𝗥𝗜𝗢', jpegThumbnail: thumb2 } }, participant: "0@s.whatsapp.net" };

        let contador = 0;
        const mencionados = participants.map(u => u.id);

        const enviarRecordatorio = async () => {
            try {
                if (contador < repeticiones) {
                    await conn.sendMessage(chatId, { 
                        forward: mQuoted.fakeObj || mQuoted, 
                        contextInfo: { mentionedJid: mencionados, isForwarded: false } 
                    }, { quoted: fkontak });
                    contador++;
                    if (contador < repeticiones) {
                        recordatorios[chatId].timeout = setTimeout(enviarRecordatorio, tiempo * 60000);
                    } else {
                        delete recordatorios[chatId];
                    }
                }
            } catch { delete recordatorios[chatId]; }
        };

        recordatorios[chatId] = { timeout: setTimeout(enviarRecordatorio, tiempo * 60000) };
        m.reply(`*SISTEMA DE RECORDATORIOS*\n\nEstatus: Programado\nFrecuencia: ${tiempo} min\nTotal: ${repeticiones}`);
    }
};

export default recordatorioCommand;
