import axios from 'axios'

const reaction = {
    emoji: '👋',
    txt_solo: '> ❒ @user1 saludo a todo el grupo, "¿Cómo están?"',
    txt_mencion: '> ❏ @user1 le dice hola a @user2, ¿Cómo estás? 👋',
    links: [
'https://media.tenor.com/R_NC_-tZTYgAAAPo/bleach-anime-ichigo-%26-rukia.mp4',
'https://media.tenor.com/-Araah2gSs4AAAPo/itadori-yuji-jjk.mp4',
'https://media.tenor.com/KM3VNP5d1FIAAAPo/miku-hello.mp4',
'https://media.tenor.com/RbxWkq_RdQAAAAPo/hello-chat-hello.mp4',
'https://media.tenor.com/_cIbOsCtx_sAAAPo/reze-chainsaw-man.mp4',
'https://media.tenor.com/4ovOqrgVbTMAAAPo/hi-anime.mp4'
]
}

const hello = {
    name: 'hello',
    alias: ['hola', 'hello', 'hi'],
    category: 'interacciones',
    run: async (m, { conn }) => {
        if (!reaction.links.length) return
        const user1 = m.sender
        const user2 = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        const name1 = '@' + user1.split('@')[0]
        const menciones = [user1]
        let textoFinal = ''
        if (user2) {
            menciones.push(user2)
            const name2 = '@' + user2.split('@')[0]
            textoFinal = reaction.txt_mencion.replace(/@user1/g, name1).replace(/@user2/g, name2)
        } else {
            textoFinal = reaction.txt_solo.replace(/@user1/g, name1)
        }
        try {
            if (m.react) await m.react(reaction.emoji)
            const videoUrl = reaction.links[Math.floor(Math.random() * reaction.links.length)]
            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                caption: textoFinal,
                gifPlayback: true,
                mentions: menciones
            }, { quoted: m })
        } catch (e) {
            console.error(e)
        }
    }
}

export default hello