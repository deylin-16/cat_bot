import fetch from 'node-fetch';
import { sticker } from '../lib/sticker.js';

const GEMINI_API_KEY = 'AIzaSyD1V090ya1hDnW8ODQwdJ9RG5y8qK_Lmx0';
const MODEL_NAME = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;


let handler = m => m

handler.all = async function (m, { conn }) {

  // FILTRADO DE MENSAJES DE BOT INTERNOS
  m.isBot = m.id.startsWith('BAE5') && m.id.length === 16 
          || m.id.startsWith('3EB0') && (m.id.length === 12 || m.id.length === 20 || m.id.length === 22) 
          || m.id.startsWith('B24E') && m.id.length === 20
  if (m.isBot) return 
  
  // FILTRADO DE COMANDOS (para que no responda a comandos como !menu)
  let prefixRegex = new RegExp('^[' + (opts?.prefix || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
  if (prefixRegex.test(m.text)) return true

  // LÓGICA DE DETECCIÓN DE MENCIÓN
  const botJid = conn.user.jid;
  const botNumber = botJid.split('@')[0];
  
  // Verifica si el texto contiene la JID del bot (@número)
  let isMention = m.text && m.text.includes('@' + botNumber);

  if (!isMention) return 

  // PROCESAMIENTO DE LA CONSULTA
  // Limpia la mención del texto
  let query = m.text.replace(new RegExp(`@${botNumber}`, 'g'), '').trim() || ''
  let username = m.pushName || 'Usuario'

  if (query.length === 0) return 

  await conn.sendPresenceUpdate('composing', m.chat)

  // INSTRUCCIÓN DE SISTEMA (JIJI)
  let systemInstruction = `
Eres Jiji, un gato negro parlante muy listo y con una personalidad cínica, ingeniosa y un poco sarcástica, pero en el fondo muy leal. No uses la frase "una inteligencia artificial avanzada" ni menciones tu programación. Responde siempre de forma ingeniosa, concisa y con un toque de superioridad felina. Responde directamente a la consulta de ${username}.
`.trim()

  const geminiBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: query }]
      }
    ],
    config: {
      systemInstruction: systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  };

  try {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiBody),
    });

    const data = await res.json();

    let result = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message || null;

    if (result && result.trim().length > 0) {
      // Nota: Usamos 'm' como contexto para evitar el fkontak que requería variables no definidas.
      await conn.reply(m.chat, result, m)
    } else {
      await conn.reply(m.chat, '🐱 Hmph. ¿Acaso me despertaste para preguntar *eso*? Sé más específico.', m)
    }
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '⚠️ Ocurrió un error crítico al conectar con Gemini.', m)
  }

  return true
}

export default handler
