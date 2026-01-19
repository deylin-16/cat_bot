let recordatorios = {};

async function handler(m, { args, command, conn, participants }) {
    const chatId = m.chat;

    if (command === 'recordatorio') {
        if (args.length < 2) return m.reply('Uso incorrecto. Responda a un mensaje y use:\n*!recordatorio [minutos] [repeticiones]*');

        let tiempo = parseInt(args[0]);
        let repeticiones = parseInt(args[1]);

        if (isNaN(tiempo) || tiempo <= 0 || isNaN(repeticiones) || repeticiones <= 0) {
            return m.reply('Parámetros inválidos. Asegúrese de ingresar números mayores a cero.');
        }

        const mQuoted = m.quoted ? m.quoted : m;
        
        if (recordatorios[chatId]) {
            clearTimeout(recordatorios[chatId].timeout);
            delete recordatorios[chatId];
        }

        let contador = 0;
        const mencionados = participants.map(u => u.id);

        const enviarRecordatorio = async () => {
            try {
                if (contador < repeticiones) {
                    await conn.copyNForward(chatId, mQuoted, true, { 
                        contextInfo: { mentionedJid: mencionados } 
                    });
                    
                    contador++;
                    
                    if (contador < repeticiones) {
                        recordatorios[chatId].timeout = setTimeout(enviarRecordatorio, tiempo * 60000);
                    } else {
                        delete recordatorios[chatId];
                    }
                }
            } catch (e) {
                delete recordatorios[chatId];
            }
        };

        recordatorios[chatId] = { 
            timeout: setTimeout(enviarRecordatorio, tiempo * 60000)
        };

        m.reply(`*SISTEMA DE RECORDATORIOS*\n\nEstatus: Activado\nIntervalo: ${tiempo} minuto(s)\nRepeticiones: ${repeticiones}\n\nEl mensaje seleccionado será reenviado periódicamente.`);
    }

    if (command === 'cancelarrecordatorio') {
        if (recordatorios[chatId]) {
            clearTimeout(recordatorios[chatId].timeout);
            delete recordatorios[chatId];
            m.reply('*Estatus:* Recordatorio cancelado exitosamente.');
        } else {
            m.reply('No se encontraron registros de recordatorios activos en este chat.');
        }
    }
}

handler.command = ['recordatorio', 'cancelarrecordatorio'];
handler.admin = true;
handler.group = true;

export default handler;
