let handler = async (m, { conn }) => {
    // Verificamos si estás respondiendo a un mensaje
    if (!m.quoted) return m.reply('❌ Responde a un paquete de stickers (la tarjeta de Sticker.ly) con este comando.');

    try {
        // Obtenemos el mensaje citado directamente de la base de datos de Baileys
        const quotedMsg = m.quoted.fakeObj ? m.quoted.fakeObj : m.quoted;
        
        // Extraemos la estructura del mensaje para ver sus metadatos
        const messageStructure = quotedMsg.message;

        // Convertimos el objeto a JSON con formato para que sea legible
        const spec = JSON.stringify(messageStructure, null, 2);

        // Devolvemos la estructura técnica del paquete
        await m.reply(spec);

    } catch (e) {
        console.error(e);
        m.reply('⚠️ No se pudo obtener la estructura de este mensaje.');
    }
}

handler.help = ['mspec'];
handler.tags = ['tools'];
handler.command = ['mspec', 'inspect', 'mstructure'];

export default handler;
