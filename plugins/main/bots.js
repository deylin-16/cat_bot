import ws from 'ws';

const listBotsCommand = {
    name: 'bots',
    alias: ['subbots', 'asistentes', 'lista'],
    category: 'main',
    run: async (m, { conn }) => {
        const users = [...new Set([...global.conns.filter((c) => c.user && c.ws?.readyState === ws.OPEN)])];

        function convertirMs(ms) {
            let segundos = Math.floor(ms / 1000);
            let minutos = Math.floor(segundos / 60);
            let horas = Math.floor(minutos / 60);
            let dias = Math.floor(horas / 24);
            segundos %= 60;
            minutos %= 60;
            horas %= 24;
            let resultado = "";
            if (dias !== 0) resultado += dias + "d ";
            if (horas !== 0) resultado += horas + "h ";
            if (minutos !== 0) resultado += minutos + "m ";
            if (segundos !== 0) resultado += segundos + "s";
            return resultado.trim();
        }

        const message = users.map((v, i) => 
`[ ${i + 1} ]
> *Nombre:* ${v.user.name || 'Asistente'}
> *Enlace:* wa.me/${v.user.jid.split('@')[0]}
> *Tiempo:* ${v.uptime ? convertirMs(Date.now() - v.uptime) : 'En línea'}`).join('\n\n');

        const responseMessage = `*𝗟𝗜𝗦𝗧𝗔 𝗗𝗘 𝗩𝗜𝗡𝗖𝗨𝗟𝗔𝗖𝗜𝗢𝗡𝗘𝗦*\n\n*Conectados:* ${users.length}\n\n${message || '> *No hay conexiones activas en este momento.*'}`.trim();

        await conn.sendMessage(m.chat, { 
            text: responseMessage, 
            mentions: conn.parseMention(responseMessage) 
        }, { quoted: m });
    }
};

export default listBotsCommand;
