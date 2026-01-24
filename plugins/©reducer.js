import * as Jimp from "jimp";

let handler = async (m, { conn, text }) => {

  if (!m.quoted || !/image|sticker/.test(m.quoted.mtype)) {
    return conn.reply(m.chat, `🍪 Responde a una imagen o sticker para reducirlo.. `, m);
  }

  if (!text) {
    return m.reply('❌ Indica las dimensiones.\nUsa: *.reduce 300x300*');
  }

  let input = text.trim().split(/[x×]/i);
  
  if (input.length !== 2 || isNaN(input[0]) || isNaN(input[1])) {
    return m.reply('❌ Formato incorrecto.\nUsa: *.reduce 300x300*');
  }

  let width = parseInt(input[0]);
  let height = parseInt(input[1]);

  if (width > 2000 || height > 2000) {
    return m.reply('⚠️ Las dimensiones son muy grandes.');
  }

  try {
    let media = await m.quoted.download?.();
    if (!media) return m.reply('❌ No se pudo descargar el archivo.');
    
    let image = await Jimp.read(media);

    image.resize(width, height);

    let buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    await conn.sendFile(m.chat, buffer, 'reducida.jpg', `✨ Imagen reducida a *${width}x${height}*`, m);
  } catch (e) {
    console.error(e);
    m.reply('⚠️ Ocurrió un error al procesar la imagen.');
  }
};

handler.command = ['reduce', 'reducir'];

export default handler;
