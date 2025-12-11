import fetch from 'node-fetch';
import { sticker } from '../lib/sticker.js';

const GEMINI_API_KEY = 'AIzaSyD1V090ya1hDnW8ODQwdJ9RG5y8qK_Lmx0';
const MODEL_NAME = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;


let handler = m => m

handler.all = async function (m, { conn }) {

  if (!conn.user) return
  
  // FILTROS DE SEGURIDAD (MANTENER)
  m.isBot = m.id.startsWith('BAE5') && m.id.length === 16 
          || m.id.startsWith('3EB0') && (m.id.length === 12 || m.id.length === 20 || m.id.length === 22) 
          || m.id.startsWith('B24E') && m.id.length === 20
  if (m.isBot) return 
  
  let prefixRegex = new RegExp('^[' + (opts?.prefix || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
  if (prefixRegex.test(m.text)) return true 
  // FIN DE FILTROS

  let username = m.pushName || 'Usuario'
  let botJid = conn.user.jid;
  let botNumber = botJid.split('@')[0];
  let text = m.text || '';

  if (text.length === 0) return 

  await conn.sendPresenceUpdate('composing', m.chat)

  // --------------------------------------------------------------------------------------------------
  // MENSAJE DE DIAGNÓSTICO (Responde a cualquier texto, ignorando la mención, para darnos los datos)
  // --------------------------------------------------------------------------------------------------
  
  let mentionData = m.mentionedJid || [];
  let botMentioned = mentionData.includes(botJid) ? 'SÍ (JID EN LISTA)' : 'NO (JID NO EN LISTA)';
  
  let response = `
⚙️ **DIAGNÓSTICO DE DATOS DE MENCIÓN**
---
**1. JID del Bot (COMPLETA):** ${botJid}
**2. Número del Bot (CORTO):** ${botNumber}
**3. Texto COMPLETO recibido (m.text):** "${text}"
**4. ¿El Bot fue mencionado? (m.mentionedJid):** ${botMentioned}
**5. Lista de Mencionados (m.mentionedJid):**
* ${mentionData.join('\n* ') || 'Ninguno'}

**Instrucción:** Ahora, prueba con la mención. El texto COMPLETO en el punto 3 debe contener el '@número'. Si el bot no responde, ¡el *handler* nunca se está ejecutando!
`.trim()

  await conn.reply(m.chat, response, m)
  // --------------------------------------------------------------------------------------------------

  return true
}

export default handler
