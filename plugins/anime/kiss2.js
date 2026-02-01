import axios from 'axios'

const reaction = {
    emoji: '🏳️‍🌈',
    txt_solo: '> ❒ @user1 se dió un beso a si mismo por qué está orgulloso de ser gay...',
    txt_mencion: '> ❏ @user1 le dió un beso a @user2 🏳️‍🌈',
    links: [
'https://media.tenor.com/_RhZ68OdXLwAAAPo/gay-anime.mp4',
'https://media.tenor.com/de3RUS-5V-EAAAPo/rp-roblox.mp4',
'https://media.tenor.com/CdKqpbRdwykAAAPo/gay-kiss.mp4',
'https://media.tenor.com/h1ISd1PmG0sAAAPo/surrender-kiss.mp4',
'https://media.tenor.com/QO7bPmYK8mEAAAPo/yaoi-sasaki-and-miyano.mp4',
'https://media.tenor.com/pzdArdE6WIMAAAPo/gay-anime.mp4'
]
}

const kiss2 = {
    name: 'kiss2',
    alias: ['beso2', 'kiss2'],
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

export default kiss2