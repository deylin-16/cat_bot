import axios from 'axios'

const reaction = {
    emoji: '😘',
    txt_solo: '❏ @user1 se dió un beso a si mismo...',
    txt_mencion: '❏ @user1 le dio un beso a @user2.',
    links: [
'https://media.tenor.com/kmxEaVuW8AoAAAPo/kiss-gentle-kiss.mp4',
'https://media.tenor.com/cQzRWAWrN6kAAAPo/ichigo-hiro.mp4',
'https://media.tenor.com/lJPu85pBQLEAAAPo/kiss.mp4',
'https://media.tenor.com/BZyWzw2d5tAAAAPo/hyakkano-100-girlfriends.mp4',
'https://media.tenor.com/SJhcVWsxgEkAAAPo/anime-kiss-anime.mp4',
'https://media.tenor.com/xDCr6DNYcZEAAAPo/sealyx-frieren-beyond-journey%27s-end.mp4'
]
}

const kiss = {
    name: 'kiss',
    alias: ['kiss', 'beso'],
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
            await conn.sendMessage(m.chat, { react: { text: reaction.emoji, key: m.key } })
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

export default kiss