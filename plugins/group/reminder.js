import fetch from 'node-fetch';

let recordatorios = global.recordatorios || {};
global.recordatorios = recordatorios;

const recordatorioCommand = {
    name: 'recordatorio',
    alias: ['remind', 'cancelarrecordatorio', 'nomore'],
    category: 'group',
    group: true,
    admin: true,
    botAdmin: true,
    run: async (m, { conn, args, command, participants: participantsFromHandler }) => {
        const chatId = m.chat;

        if (command === 'cancelarrecordatorio' || command === 'nomore') {
            if (recordatorios[chatId]) {
                clearTimeout(recordatorios[chatId].timeout);
                delete recordatorios[chatId];
                return m.reply('❯❯ 𝗘𝗦𝗧𝗔𝗧𝗨𝗦: Proceso finalizado y memoria liberada.');
            }
            return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se detectaron tareas activas en este chat.');
        }

        if (args.length < 2) {
            return m.reply('❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .recordatorio [minutos] [repeticiones]\nNota: Debes responder a un mensaje o escribir un texto.');
        }

        const tiempo = parseInt(args[0]);
        const repeticiones = parseInt(args[1]);

        if (isNaN(tiempo) || tiempo <= 0 || tiempo > 1440) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Tiempo inválido (Rango: 1-1440 min).');
        if (isNaN(repeticiones) || repeticiones <= 0 || repeticiones > 100) return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Repeticiones inválidas (Máx: 100).');

        const mQuoted = m.quoted ? m.quoted : (m.text ? m : null);
        if (!mQuoted || (mQuoted === m && !args[2] && !m.quoted)) {
             
             return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se especificó el contenido del recordatorio. Responde a un mensaje o añade texto.');
        }

        let mencionados = [];
        try {
            const participants = participantsFromHandler || (await conn.groupMetadata(chatId)).participants;
            mencionados = participants.map(u => u.id);
        } catch {
            return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo obtener la lista de miembros.');
        }

        if (recordatorios[chatId]) {
            clearTimeout(recordatorios[chatId].timeout);
            delete recordatorios[chatId];
        }

        let thumb2;
        try {
            const res = await fetch('https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1768838597942_CHk6Hpv5C.jpeg');
            thumb2 = Buffer.from(await res.arrayBuffer());
        } catch {
            thumb2 = Buffer.alloc(0);
        }

        const fkontak = { 
            key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "DeylinSystem" }, 
            message: { locationMessage: { name: '𝗥𝗘𝗖𝗢𝗥𝗗𝗔𝗧𝗢𝗥𝗜𝗢 𝗔𝗖𝗧𝗜𝗩𝗢', jpegThumbnail: thumb2 } }, 
            participant: "0@s.whatsapp.net" 
        };

        let contador = 0;
        const ejecutarEnvio = async () => {
            try {
                if (recordatorios[chatId] && contador < repeticiones) {
                    // Usamos copyNForward para mantener la integridad del mensaje citado (fotos, videos, stickers, etc)
                    await conn.sendMessage(chatId, { 
                        forward: mQuoted.fakeObj || mQuoted, 
                        contextInfo: { 
                            mentionedJid: mencionados, 
                            isForwarded: false,
                            forwardingScore: 0
                        } 
                    }, { quoted: fkontak });

                    contador++;

                    if (contador < repeticiones) {
                        recordatorios[chatId].timeout = setTimeout(ejecutarEnvio, tiempo * 60000);
                    } else {
                        delete recordatorios[chatId];
                        await conn.sendMessage(chatId, { text: '❯❯ 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗖𝗜𝗢́𝗡: Ciclo de recordatorio completado.' });
                    }
                }
            } catch (e) {
                console.error('Error en recordatorio:', e);
                delete recordatorios[chatId];
            }
        };

        recordatorios[chatId] = { 
            timeout: setTimeout(ejecutarEnvio, tiempo * 60000),
            data: { tiempo, repeticiones, iniciador: m.sender }
        };

        m.reply(`❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n❖ 𝗘𝗦𝗧𝗔𝗧𝗨𝗦: Programado\n❖ 𝗜𝗡𝗧𝗘𝗥𝗩𝗔𝗟𝗢: ${tiempo} min\n❖ 𝗜𝗧𝗘𝗥𝗔𝗖𝗜𝗢𝗡𝗘𝗦: ${repeticiones}\n❖ 𝗠𝗘𝗧𝗔𝗗𝗔𝗧𝗔: Tag-All activo\n\nPara detener: .cancelarrecordatorio`);
    }
};

export default recordatorioCommand;
