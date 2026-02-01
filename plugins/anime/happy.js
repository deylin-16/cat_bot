import axios from 'axios'

const reaction = {
    emoji: '😁',
    txt_solo: '> ❒ @user1 está feliz happy happy happy.... 😁',
    txt_mencion: '> ❏ @user1 está feliz por @user2',
    links: [
'https://media.tenor.com/ZQndYO4NwBcAAAPo/gojo-satoru.mp4',
'https://media.tenor.com/NACzM0o4iv4AAAPo/happy-easter.mp4',
'https://media.tenor.com/UuGHB-dCG_gAAAPo/konata-happy.mp4',
'https://media.tenor.com/uXIogZmtfiYAAAPo/haru-yoshida-tonari-no-kaibutsu-kun.mp4',
'https://media.tenor.com/V8f3qPS23LgAAAPo/ao-sorakado-summer-pockets.mp4',
'https://media.tenor.com/myCsjxxbtXAAAAPo/anime-happy.mp4'
]
}

const happy = {
    name: 'happy',
    alias: ['happy', 'feliz'],
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

export default happy