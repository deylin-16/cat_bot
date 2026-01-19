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
    '593': 'America/Guayaquil',
    '502': 'America/Guatemala',
    '503': 'America/El_Salvador',
    '505': 'America/Managua',
    '506': 'America/Costa_Rica',
    '507': 'America/Panama',
    '591': 'America/La_Paz',
    '595': 'America/Asuncion',
    '598': 'America/Montevideo',
    '53': 'America/Havana',
    '1809': 'America/Santo_Domingo',
    '1829': 'America/Santo_Domingo',
    '1849': 'America/Santo_Domingo',
    '1787': 'America/Puerto_Rico',
    '1939': 'America/Puerto_Rico',
    '240': 'Africa/Malabo',
    '1': 'America/New_York',
    '55': 'America/Sao_Paulo',
    '44': 'Europe/London',
    '33': 'Europe/Paris',
    '49': 'Europe/Berlin',
    '39': 'Europe/Rome',
    '351': 'Europe/Lisbon',
    '7': 'Asia/Moscow',
    '86': 'Asia/Shanghai',
    '81': 'Asia/Tokyo',
    '82': 'Asia/Seoul',
    '91': 'Asia/Kolkata',
    '62': 'Asia/Jakarta',
    '63': 'Asia/Manila',
    '61': 'Australia/Sydney',
    '20': 'Africa/Cairo',
    '27': 'Africa/Johannesburg',
    '971': 'Asia/Dubai',
    '966': 'Asia/Riyadh',
    '90': 'Europe/Istanbul'
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

let handler = async (m, { conn, args, command, groupMetadata }) => {
    const chatId = m.chat;
    const tz = getTz(m.sender);
    const horaActual = moment().tz(tz).format('hh:mm A');
    const isAnnounce = groupMetadata.announce;

    const adReply = {
        externalAdReply: {
            title: "𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡",
            body: `Zona Horaria: ${tz}`,
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: "https://ik.imagekit.io/pm10ywrf6f/dynamic_Bot_by_deylin/1767146401111_3j2wTlRTQ8.jpeg",
            renderLargerThumbnail: false
        }
    };

    if (command === 'cerrar' || command === 'close') {
        if (isAnnounce) return m.reply(`⚠️ *AVISO:* El grupo ya se encuentra *CERRADO* actualmente.\nSolo administradores pueden escribir.`);
        await conn.groupSettingUpdate(chatId, 'announcement');
        return conn.sendMessage(chatId, { 
            text: `🔒 *GRUPO CONFIGURADO*\n\nAcción: Cierre inmediato\nEstado: Solo Admins\nHora: ${horaActual} (${tz})\n\n> El sistema ha restringido el envío de mensajes a miembros generales.`,
            contextInfo: adReply
        });
    }

    if (command === 'abrir' || command === 'open') {
        if (!isAnnounce) return m.reply(`⚠️ *AVISO:* El grupo ya se encuentra *ABIERTO* actualmente.\nTodos pueden participar.`);
        await conn.groupSettingUpdate(chatId, 'not_announcement');
        return conn.sendMessage(chatId, { 
            text: `🔓 *GRUPO CONFIGURADO*\n\nAcción: Apertura inmediata\nEstado: Todos pueden escribir\nHora: ${horaActual} (${tz})\n\n> El sistema ha habilitado la participación para todos los miembros.`,
            contextInfo: adReply
        });
    }

    if (args[0] === 'cancelar') {
        const c = global.programaciones.cierres[chatId];
        const a = global.programaciones.aperturas[chatId];
        if (c) { clearTimeout(c); delete global.programaciones.cierres[chatId]; }
        if (a) { clearTimeout(a); delete global.programaciones.aperturas[chatId]; }
        return m.reply('✅ *OPERACIÓN CANCELADA*\nSe han eliminado todas las tareas programadas para este chat.');
    }

    if (!args[0]) {
        return m.reply(`⚙️ *PANEL DE CONTROL DE GRUPO*\n\n*Inmediatos:*\n- .abrir | .cerrar\n\n*Programar cierre:*\n- .cerrargrupo 10:00pm\n- .cerrargrupo 1h (o 30m / 15s)\n\n*Programar apertura:*\n- .abrirgrupo 08:00am\n- .abrirgrupo 2h\n\n*Tu Ubicación:* ${tz}\n*Tu Hora:* ${horaActual}`);
    }

    const resultado = parseTiempo(args[0], tz);
    if (!resultado) return m.reply('⛔ *ERROR:* Formato de tiempo inválido.\nUse: 10:00pm, 1h, 30m o 20s.');

    const { ms, fecha } = resultado;
    const horaDestino = fecha.format('hh:mm:ss A');

    if (command === 'cerrargrupo') {
        if (global.programaciones.cierres[chatId]) clearTimeout(global.programaciones.cierres[chatId]);
        global.programaciones.cierres[chatId] = setTimeout(async () => {
            try {
                await conn.groupSettingUpdate(chatId, 'announcement');
                await conn.sendMessage(chatId, { 
                    text: `🔒 *CIERRE AUTOMÁTICO*\n\nSe ha cumplido el horario programado.\nEstado: Solo Administradores.`,
                    contextInfo: adReply
                });
            } catch (e) { console.error(e); }
            delete global.programaciones.cierres[chatId];
        }, ms);
        return m.reply(`✅ *CIERRE PROGRAMADO*\n\nEjecución: ${horaDestino}\nPaís: ${tz}\n\n> El grupo se cerrará automáticamente en el tiempo indicado.`);
    }

    if (command === 'abrirgrupo') {
        if (global.programaciones.aperturas[chatId]) clearTimeout(global.programaciones.aperturas[chatId]);
        global.programaciones.aperturas[chatId] = setTimeout(async () => {
            try {
                await conn.groupSettingUpdate(chatId, 'not_announcement');
                await conn.sendMessage(chatId, { 
                    text: `🔓 *APERTURA AUTOMÁTICA*\n\nSe ha cumplido el horario programado.\nEstado: Todos pueden escribir.`,
                    contextInfo: adReply
                });
            } catch (e) { console.error(e); }
            delete global.programaciones.aperturas[chatId];
        }, ms);
        return m.reply(`✅ *APERTURA PROGRAMADA*\n\nEjecución: ${horaDestino}\nPaís: ${tz}\n\n> El grupo se abrirá automáticamente en el tiempo indicado.`);
    }
};

handler.command = /^(cerrargrupo|abrirgrupo|abrir|cerrar|open|close)$/i;
handler.admin = true;
handler.botAdmin = true;
handler.group = true;

export default handler;
