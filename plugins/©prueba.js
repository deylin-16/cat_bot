let handler = async (m, { conn, text }) => {
    
    let mensaje = text || 'Esta es una respuesta de prueba utilizando el nuevo sistema de diseño global.';

  
    await global.design(conn, m, mensaje);
}

handler.command = ['prueba']
handler.help = ['prueba']
handler.tags = ['main']

export default handler
