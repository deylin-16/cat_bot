import { createHash } from 'crypto';  
import fetch from 'node-fetch';

const handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  let chat = global.db.data.chats[m.chat];
  let user = global.db.data.users[m.sender];
  let bot = global.db.data.settings[conn.user.jid] || {};
  let type = command.toLowerCase();
  let isAll = false, isUser = false;
  let isEnable = false;

switch (type) {
    case 'autor':
    case 'res':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      isEnable = chat.autoresponder = !chat.autoresponder;
      break;


    case 'modoadmin':
    case 'soloadmin':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      }
      isEnable = chat.modoadmin = !chat.modoadmin;
      break;


    case 'detect':
      if (!m.isGroup) {
        if (!isOwner) {
          global.dfail('group', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      isEnable = chat.detect = !chat.detect;
      break;


  
    case 'welcome':
    case 'bv':
    case 'bienvenida':
      if (!m.isGroup) {
       if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn);
          throw false;
        }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn);
        throw false;
      }
      isEnable = chat.welcome = !chat.welcome;
      break;

    }
  global.design(conn, m, ` La función *${type}* se *${isEnable ? 'activó' : 'desactivó'}* ${isAll ? 'para este Bot' : isUser ? '' : 'para este chat'}`);
};

handler.command = [
  '@welcome', 'bv', 'soloadmin', 'modoadmin', '@bienvenida', 'autor', 'res', 'detect'
]
export default handler