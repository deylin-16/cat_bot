import Jimp from "jimp";

let handler = async (m, { conn, text }) => {

  if (!text || !m.quoted || !/image|sticker/.test(m.quoted.mtype)) {
    return conn.reply(m.chat, `🍪 Responde a una imagen o sticker para reducirlo.`, m);
  }


  let input = text.trim().split(/[x]/i);
  if (input.length !== 2 || isNaN(input[0]) || isNaN(input[1])) {
    return m.reply('❌ Formato incorrecto.\nUsa: *.reduce 300×300*');
  }

  let width = parseInt(input[0]);
  let height = parseInt(input[1]);

  try {
    let media = await m.quoted.download?.();
    let image = await Jimp.read(media);

    image.resize(width, height);

    let buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    await conn.sendFile(m.chat, buffer, 'reducida.jpg', ` Imagen reducida a *${width}×${height}*`, m);
  } catch (e) {
    console.error(e);
    m.reply('⚠️ Ocurrió un error al procesar la imagen.');
  }
};

handler.command = ['reduce', 'reducir'];

export default handler;