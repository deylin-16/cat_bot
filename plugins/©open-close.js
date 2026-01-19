import moment from 'moment-timezone';

global.programaciones = global.programaciones || { cierres: {}, aperturas: {} };

const phoneToTz = {
    '504': 'America/Tegucigalpa',
    '52': 'America/Mexico_City',
    '54': 'America/Argentina/Buenos_Aires',
    '57': 'America/Bogota',
    '51': 'America/Lima',
    '56': 'America/Santiago',
    '34': 'Europe/Madrid',
    '58': 'America/Caracas',
    '593': 'America/Guayaquil'
};

function getTz(jid) {
    const number = jid.split('@')[0];
    for (const prefix in phoneToTz) {
        if (number.startsWith(prefix)) return phoneToTz[prefix];
    }
    return 'America/Mexico_City';
}

function parseTiempo(entrada, tz) {
    entrada = entrada.toLowerCase().replace(/\s/g, '');
    const ahora = moment().tz(tz);

    if (/^\d{1,2}:\d{2}(am|pm)?$/.test(entrada)) {
        let [full, h, m, p] = entrada.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
        let horas = parseInt(h);
        const minutos = parseInt(m);

        if (p === 'pm' && horas < 12) horas += 12;
        if (p === 'am' && horas === 12) horas = 0;

        let objetivo = moment.tz(tz).set({ hour: horas, minute: minutos, second: 0, millisecond: 0 });
        if (objetivo.isBefore(ahora)) objetivo.add(1, 'days');

        return { ms: objetivo.diff(ahora), fecha: objetivo };
    }

    const duracionMatch = entrada.match(/^(\d+)(h|m|s)$/);
    if (duracionMatch) {
        const valor = parseInt(duracionMatch[1]);
        const unidad = duracionMatch[2];
        const ms = valor * { 'h': 3600000, 'm': 60000, 's': 1000 }[unidad];
        return { ms, fecha: moment().tz(tz).add(ms, 'ms') };
    }
    return null;
}

let handler = async (m, { conn, args, command }) => {
    const chatId = m.chat;
    const tz = getTz(m.sender);
    const horaActual = moment().tz(tz).format('hh:mm:ss A');

    if (command === 'cerrar' || command === 'close') {
        await conn.groupSettingUpdate(chatId, 'announcement');
        return m.reply(`🔒 *GRUPO CERRADO*\n\nAcción inmediata ejecutada.\n*Hora local (${tz}):* ${horaActual}`);
    }

    if (command === 'abrir' || command === 'open') {
        await conn.groupSettingUpdate(chatId, 'not_announcement');
        return m.reply(`🔓 *GRUPO ABIERTO*\n\nAcción inmediata ejecutada.\n*Hora local (${tz}):* ${horaActual}`);
    }

    if (args[0] === 'cancelar') {
        const c = global.programaciones.cierres[chatId];
        const a = global.programaciones.aperturas[chatId];
        if (c) { clearTimeout(c); delete global.programaciones.cierres[chatId]; }
        if (a) { clearTimeout(a); delete global.programaciones.aperturas[chatId]; }
        return m.reply('✅ Todas las programaciones para este grupo han sido canceladas.');
    }

    if (!args[0]) {
        return m.reply(`⏰ *SISTEMA DE HORARIOS*\n\n*Inmediatos:*\n.abrir | .cerrar\n\n*Programados:*\n.cerrargrupo 10:00pm\n.abrirgrupo 1h | 30m | 15s\n\n*Admin local:* ${tz}\n*Hora:* ${horaActual}`);
    }

    const resultado = parseTiempo(args[0], tz);
    if (!resultado) return m.reply('⛔ Formato inválido. Use 10:00pm, 1h, 10m o 30s.');

    const { ms, fecha } = resultado;
    const horaDestino = fecha.format('hh:mm:ss A');

    if (command === 'cerrargrupo') {
        if (global.programaciones.cierres[chatId]) clearTimeout(global.programaciones.cierres[chatId]);
        global.programaciones.cierres[chatId] = setTimeout(async () => {
            try {
                await conn.groupSettingUpdate(chatId, 'announcement');
                await conn.sendMessage(chatId, { text: `🔒 *CIERRE PROGRAMADO*\nEl grupo ha sido cerrado según lo previsto.` });
            } catch (e) { console.error(e); }
            delete global.programaciones.cierres[chatId];
        }, ms);
        return m.reply(`✅ Cierre programado para las: *${horaDestino}*\n(Hora de ${tz})`);
    }

    if (command === 'abrirgrupo') {
        if (global.programaciones.aperturas[chatId]) clearTimeout(global.programaciones.aperturas[chatId]);
        global.programaciones.aperturas[chatId] = setTimeout(async () => {
            try {
                await conn.groupSettingUpdate(chatId, 'not_announcement');
                await conn.sendMessage(chatId, { text: `🔓 *APERTURA PROGRAMADA*\nEl grupo ha sido abierto según lo previsto.` });
            } catch (e) { console.error(e); }
            delete global.programaciones.aperturas[chatId];
        }, ms);
        return m.reply(`✅ Apertura programada para las: *${horaDestino}*\n(Hora de ${tz})`);
    }
};

handler.command = /^(cerrargrupo|abrirgrupo|abrir|cerrar|open|close)$/i;
handler.admin = true;
handler.botAdmin = true;
handler.group = true;

export default handler;
