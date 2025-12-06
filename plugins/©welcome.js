import { WAMessageStubType } from '@whiskeysockets/baileys'

export async function before(m, { conn }) {
    if (!m.messageStubType || !m.isGroup) return
    const who = m.messageStubParameters?.[0]
    if (!who) return

    const chat = global.db?.data?.chats?.[m.chat] || {}

    const isWelcomeEvent = m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD || 
                           m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_JOIN;
                           
    if (isWelcomeEvent && chat.welcome !== false) {

        let ppGroup = null
        const ppGroupDefaultUrl = 'https://i.ibb.co/Psj3rJmR/Texto-del-p-rrafo-20251206-140954-0000.png'

        try {
            ppGroup = await conn.profilePictureUrl(m.chat, 'image')
        } catch (e) {
            ppGroup = ppGroupDefaultUrl
        }

        const mentionListText = `@${who.split("@")[0]}` 
        let welcomeText = chat.customWelcome || "bienvenido al grupo @user"
        welcomeText = welcomeText.replace(/\\n/g, '\n')
        let finalCaption = welcomeText.replace(/@user/g, mentionListText) 

        try {
            const messageOptions = {
                mentions: [who]
            }

            messageOptions.image = { url: ppGroup }
            messageOptions.caption = finalCaption

            await conn.sendMessage(m.chat, messageOptions)

        } catch (e) {
            
            const errorMsg = `❌ *FALLO AL ENVIAR BIENVENIDA*\n\n*Error:* ${e.name}: ${e.message}\n\n⚠️ Esto puede deberse a la falta de permisos del bot (no es Admin) o a que el grupo está en modo 'Solo Admin'.`
            
            console.error("ERROR AL ENVIAR BIENVENIDA (VERIFICAR PERMISOS DEL BOT O FALLA DE CONEXIÓN):", e)
            
            try {
                await conn.sendMessage(m.chat, { text: errorMsg })
            } catch (errorReportingFailed) {
                console.error("FATAL: Falló el envío del mensaje de bienvenida Y el reporte de error.", errorReportingFailed)
            }
        }
    }
}
