import { WAMessageStubType } from '@whiskeysockets/baileys'

export async function before(m, { conn }) {
    // 1. Detectar cualquier evento de grupo que no sea un mensaje normal
    if (!m.messageStubType || !m.isGroup) return
    
    const who = m.messageStubParameters?.[0]
    
    // 2. Reportar los datos de la detección
    const report = `🚨 *EVENTO DE DETECCIÓN (DIAGNÓSTICO)* 🚨
    
*Tipo de Evento (Raw ID):* ${m.messageStubType}
*ID de Usuario Afectado (JID):* ${who || 'N/A'}
*Nombre del Evento (si existe):* ${WAMessageStubType[m.messageStubType] || 'Desconocido'}
    
⚠️ *Instrucción:* Si este evento ocurrió al aprobar una solicitud en la Comunidad, por favor copia el *Raw ID* y envíamelo.`;

    try {
        // 3. Enviar el reporte al chat
        await conn.sendMessage(m.chat, { text: report })
    } catch (e) {
        // Si falla el envío del reporte, solo loguear a la consola.
        console.error("ERROR AL ENVIAR REPORTE DE DIAGNÓSTICO:", e)
    }
}
