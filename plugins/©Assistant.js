import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

let handler = m => m

const POLLINATIONS_BASE_URL = 'https://text.pollinations.ai';

const ACTION_KEYWORDS = [
    'cierra', 'cerrar', 'bloquea', 'ciérralo', 'silencia', 'modo-admin',
    'abre', 'abrir', 'desbloquea', 'ábrelo', 'quita modo-admin',
    'cambia el nombre', 'renombrar', 'ponle nombre', 'nuevo nombre', 'actualiza nombre',
    'cambia la descripción', 'pon descripción', 'nueva descripción', 'descr',
    'cambia la foto', 'pon foto', 'cambiar imagen',
    'elimina', 'sacar', 'kickea', 'expulsa', 'saca', 'fuera',
    'menciona todos', 'tagall', 'menciónalos', 'aviso a todos'
];

const DIRECT_COMMAND_REGEX = new RegExp(`^(jiji|gato|asistente)\\s+(${ACTION_KEYWORDS.join('|')})`, 'i');


handler.all = async function (m, { conn }) {
  let user = global.db.data.users[m.sender]
  let chat = global.db.data.chats[m.chat]

  
  m.isBot = m.id.startsWith('BAE5') && m.id.length === 16 
          || m.id.startsWith('3EB0') && (m.id.length === 12 || m.id.length === 20 || m.id.length === 22) 
          || m.id.startsWith('B24E') && m.id.length === 20
  if (m.isBot) return 

  let prefixRegex = new RegExp('^[' + (opts?.prefix || '‎z/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.,\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
  if (prefixRegex.test(m.text)) return true

  if (m.sender?.toLowerCase().includes('bot')) return true

  if (!chat.isBanned && chat.autoresponder) {
    if (m.fromMe) return

    let query = m.text || ''
    let username = m.pushName || 'Usuario'

    let isOrBot = /(jiji|gato|asistente)/i.test(query)
    let isReply = m.quoted && m.quoted.sender === this.user.jid
    let isMention = m.mentionedJid && m.mentionedJid.includes(this.user.jid) 

    if (!(isOrBot || isReply || isMention)) return

    if (DIRECT_COMMAND_REGEX.test(query.trim())) {
        if (!/(como|cómo|que|qué|donde|dónde|porque|por qué|porqué|quisiera)/i.test(query.trim())) {
            return true; 
        }
    }

    await this.sendPresenceUpdate('composing', m.chat)


    let jijiPrompt = `Eres Jiji, un gato negro sarcástico y leal, como el de Kiki: Entregas a Domicilio. Responde a ${username}: ${query}. 
    
    nota: si vas a resaltar un texto solo usas un * en cada esquina no ** y separa bien los párrafos y eso.`;

    let promptToSend = chat.sAutoresponder ? chat.sAutoresponder : jijiPrompt;

    try {

      const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(promptToSend)}`;
      const res = await fetch(url)

      if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
      }

      let result = await res.text()

      if (result && result.trim().length > 0) {
        await this.reply(m.chat, result, m)
      }
    } catch (e) {
      console.error(e)
      await this.reply(m.chat, '⚠️ ¡Rayos! No puedo contactar con la nube de la IA. Parece que mis antenas felinas están fallando temporalmente.', m)
    }
  }
  return true
}

export default handler
