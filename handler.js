import chalk from 'chalk';
import urlRegex from 'url-regex-safe';

function minimalSmsg(conn, m) {
    if (!m || !m.key || !m.key.remoteJid) return null;
    const botJid = conn.user?.jid || global.conn?.user?.jid || '';
    if (!botJid) return null;
    try {
        m.chat = conn.normalizeJid(m.key.remoteJid);
        m.sender = conn.normalizeJid(m.key.fromMe ? botJid : m.key.participant || m.key.remoteJid);
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.text = m.message?.extendedTextMessage?.text || m.message?.conversation || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';
        m.text = m.text ? m.text.replace(/[\u200e\u200f]/g, '').trim() : '';
        m.isCommand = (global.prefix instanceof RegExp ? global.prefix.test(m.text.trim()[0]) : m.text.startsWith(global.prefix || '!') );
        m.isMedia = !!(m.message?.imageMessage || m.message?.videoMessage || m.message?.audioMessage || m.message?.stickerMessage || m.message?.documentMessage);
        return m;
    } catch (e) {
        return null;
    }
}

async function menu(conn, m) {
    const texto = `Hola, soy el bot Kirito.
    
✅ *¡Comando Ejecutado con Éxito!*
    
El bot ha respondido. Esto confirma que el bot está totalmente funcional.
    
*Ahora puedes reintroducir tu lógica de plugins.*`;
    
    await conn.reply(m.chat, texto, m);
}

export async function handler(chatUpdate) {
    const conn = this;
    
    try {
        if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) return;
        let m = chatUpdate.messages[chatUpdate.messages.length - 1];
        if (!m || !m.key || !m.message || !m.key.remoteJid) return;
        if (!conn.user?.jid) return; 

        if (m.message) {
            m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message;
        }

        m = minimalSmsg(conn, m); 
        if (!m || !m.chat || !m.sender) return; 
        
        // --- INICIO DE IMPRESIÓN FORZADA ---
        try {
            const senderName = m.sender.split('@')[0]; 
            const chatName = m.isGroup ? m.chat.substring(0, 10) : 'Privado';

            const now = new Date();
            const formattedTime = now.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const logLine = chalk.bold.green('✅ EVENTO RECIBIDO ') +
                            chalk.hex('#FF4500')(`${chatName}: `) +
                            chalk.hex('#FFFF00')(`${senderName}: `) +
                            (m.text.substring(0, 40));

            console.log(logLine);
            
        } catch (printError) {
            console.error(chalk.red('Error al imprimir mensaje en consola (AÚN HAY BLOQUEO):'), printError);
        }
        // --- FIN DE IMPRESIÓN ---
        
        // Lógica de comando manual de prueba
        if (m.isCommand) {
             const command = m.text.toLowerCase().split(/\s+/)[0].replace(global.prefix || '!', '');
             if (command === 'menu' || command === 'up') {
                 return await menu(conn, m);
             }
        }
        


    } catch (e) {
        console.error(chalk.bold.bgRed('❌ ERROR CRÍTICO NO MANEJADO EN HANDLER ❌'));
        console.error(e);
    }
}
