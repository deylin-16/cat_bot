import axios from 'axios'

const reaction = {
    emoji: '🤣',
    txt_solo: '> ❒ @user1 se está riendo jajaksjasja... 🤣',
    txt_mencion: '> ❏ @user1 se está riendo de @user2 🤣',
    links: [
'https://media.tenor.com/nqTDeAS9sL8AAAPo/fairy-tail-natsu.mp4',
'https://media.tenor.com/CG8uhh9CoJcAAAPo/shikimori-shikimoris-not-just-cute.mp4',
'https://media.tenor.com/4-naM7LyYJAAAAPo/goon-tuah.mp4',
'https://media.tenor.com/BP9vMzwRSZwAAAPo/laughing-lol.mp4',
'https://media.tenor.com/mzIscFHY8L0AAAPo/blue-box-ao-no-hako.mp4',
'https://media.tenor.com/CXsIEWMlv6kAAAPo/funny-mio-mio-mio-ni.mp4'
]
}

const laugh = {
    name: 'laugh',
    alias: ['reír', 'laugh'],
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

export default laugh