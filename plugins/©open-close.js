global.programaciones = global.programaciones || { cierres: {}, aperturas: {} };

function parseTiempo(entrada) {
    entrada = entrada.toLowerCase().replace(/\s/g, '');
    const ahora = new Date();

    if (/^\d{1,2}:\d{2}(am|pm)?$/.test(entrada)) {
        let [, horasStr, minutosStr, periodo] = entrada.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
        let horas = parseInt(horasStr);
        let minutos = parseInt(minutosStr);

        if (periodo === 'pm' && horas < 12) horas += 12;
        if (periodo === 'am' && horas === 12) horas = 0;

        const objetivo = new Date(ahora);
        objetivo.setHours(horas, minutos, 0, 0);

        if (objetivo <= ahora) objetivo.setDate(objetivo.getDate() + 1);
        return { ms: objetivo.getTime() - ahora.getTime(), fecha: objetivo };
    }

    const duracionMatch = entrada.match(/^(\d+)(h|m|s)$/);
    if (duracionMatch) {
        const valor = parseInt(duracionMatch[1]);
        const unidad = duracionMatch[2];
        const multiplicador = { 'h': 3600000, 'm': 60000, 's': 1000 }[unidad];
        const ms = valor * multiplicador;
        return { ms, fecha: new Date(ahora.getTime() + ms) };
    }

    return null;
}

let handler = async (m, { conn, args, command }) => {
    const chatId = m.chat;

    if (args[0] === 'cancelar') {
        if (global.programaciones.cierres[chatId]) {
            clearTimeout(global.programaciones.cierres[chatId]);
            delete global.programaciones.cierres[chatId];
        }
        if (global.programaciones.aperturas[chatId]) {
            clearTimeout(global.programaciones.aperturas[chatId]);
            delete global.programaciones.aperturas[chatId];
        }
        return m.reply('✅ Programaciones canceladas.');
    }

    if (!args[0]) {
        return m.reply(`⏰ Uso: .${command} <hora/tiempo>\nEj: .${command} 07:00pm\nEj: .${command} 1h\nEj: .${command} cancelar`);
    }

    const resultado = parseTiempo(args[0]);
    if (!resultado) return m.reply('⛔ Formato inválido.');

    const { ms, fecha } = resultado;
    const horaDestino = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (command === 'cerrargrupo') {
        if (global.programaciones.cierres[chatId]) clearTimeout(global.programaciones.cierres[chatId]);

        global.programaciones.cierres[chatId] = setTimeout(async () => {
            try {
                await conn.groupSettingUpdate(chatId, 'announcement');
                await conn.sendMessage(chatId, {
                    text: `🔒 *GRUPO CERRADO*\nAcción programada ejecutada.`
                });
            } catch (e) {
                console.error(e);
            }
            delete global.programaciones.cierres[chatId];
        }, ms);

        return m.reply(`✅ Cierre programado: *${horaDestino}*`);
    }

    if (command === 'abrirgrupo') {
        if (global.programaciones.aperturas[chatId]) clearTimeout(global.programaciones.aperturas[chatId]);

        global.programaciones.aperturas[chatId] = setTimeout(async () => {
            try {
                await conn.groupSettingUpdate(chatId, 'not_announcement');
                await conn.sendMessage(chatId, {
                    text: `🔓 *GRUPO ABIERTO*\nAcción programada ejecutada.`
                });
            } catch (e) {
                console.error(e);
            }
            delete global.programaciones.aperturas[chatId];
        }, ms);

        return m.reply(`✅ Apertura programada: *${horaDestino}*`);
    }
};

handler.command = /^(cerrargrupo|abrirgrupo)$/i;
handler.admin = true;
handler.botAdmin = true;
handler.group = true;

export default handler;
