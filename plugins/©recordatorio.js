let recordatorios = {};

async function handler(m, { args, command, conn, participants }) {
    const chatId = m.chat;

    if (command === 'recordatorio') {
        if (args.length < 2) return m.reply('Uso correcto: *!recordatorio [minutos] [repeticiones]* (Respondiendo a un mensaje)\n\n EJ: #recordatorio 1 3\nCantidad: 3 veces\nCada: 1 minuto');

        let tiempo = parseInt(args[0]);
        let repeticiones = parseInt(args[1]);

        if (isNaN(tiempo) || tiempo <= 0 || isNaN(repeticiones) || repeticiones <= 0) {
            return m.reply('Parámetros numéricos inválidos.');
        }

        const mQuoted = m.quoted ? m.quoted : m;
        if (!mQuoted) return m.reply('No se detectó un mensaje para procesar.');

        if (recordatorios[chatId]) {
            clearTimeout(recordatorios[chatId].timeout);
            delete recordatorios[chatId];
        }

        let contador = 0;
        const mencionados = participants.map(u => u.id);

        const enviarRecordatorio = async () => {
            try {
                if (contador < repeticiones) {
                    await conn.sendMessage(chatId, { 
                        forward: mQuoted.fakeObj || mQuoted, 
                        contextInfo: { 
                            mentionedJid: mencionados,
                            isForwarded: false 
                        } 
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

        m.reply(`*SISTEMA DE RECORDATORIOS*\n\nEstatus: Programado\nFrecuencia: ${tiempo} min\nTotal: ${repeticiones}\n\nEl conteo ha iniciado. La primera notificación se enviará en ${tiempo} minuto(s).`);
    }

    if (command === 'cancelarrecordatorio') {
        if (recordatorios[chatId]) {
            clearTimeout(recordatorios[chatId].timeout);
            delete recordatorios[chatId];
            m.reply('*Estatus:* Proceso finalizado.');
        } else {
            m.reply('No existen tareas activas en este chat.');
        }
    }
}

handler.command = ['recordatorio', 'cancelarrecordatorio'];
handler.admin = true;
handler.group = true;

export default handler;
