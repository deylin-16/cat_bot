let handler = async (m, { conn }) => {
  
    if (!m.quoted) return m.reply('❌ Responde a un paquete de stickers (la tarjeta de Sticker.ly) con este comando.');

    try {
        
        const quotedMsg = m.quoted.fakeObj ? m.quoted.fakeObj : m.quoted;
        
        
        const messageStructure = quotedMsg.message;

        
        const spec = JSON.stringify(messageStructure, null, 2);

        
        await m.reply(spec);

    } catch (e) {
        console.error(e);
        m.reply('⚠️ No se pudo obtener la estructura de este mensaje.');
    }
}

handler.command = ['mspec', 'inspect', 'mstructure'];

export default handler;
