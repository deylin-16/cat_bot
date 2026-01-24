import fetch from 'node-fetch';

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

let handler = async (m, { conn, command, args }) => {
  let link = args[0];

  if (!link) {
    return conn.reply(m.chat, ` Por favor, ingrese el *enlace de una página web*.`, m);
  }

  if (!isValidUrl(link)) {
    return conn.reply(m.chat, ` El enlace proporcionado *no es válido*.`, m);
  }

  try {
    await m.react('🍪');
    await conn.reply(m.chat, `Generando captura de pantalla de:\n${link}`, m);

    let response = await fetch(`https://image.thum.io/get/fullpage/${link}`);
    if (!response.ok) throw new Error(`Error al obtener la captura`);

    let buffer = await response.buffer();

    await conn.sendFile(m.chat, buffer, 'screenshot.png', `✅ Captura de *${link}*`, m);
    await m.react('🫧');

  } catch (err) {
    console.error(err);
    await conn.reply(m.chat, `Ocurrió un error al capturar la web.`, m);
    await m.react('✖️');
  }
};

handler.command = ['ss'];

export default handler;
