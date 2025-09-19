/**
 * Help message
 * Usage: .help
 */

const helpText = `
👋 *¡Hola! ¿Necesitas ayuda?*

💬 *Escribe a nuestro soporte:*  
📱 *@HKRELHR* //telegram

✨ *Estamos para ayudarte en lo que necesites.*
`
export default {
    name: "help",
    description: "Command of help",
    /**
     * sends a help message
     * @param {object} sock -Whatsapp socket instanse
     * @param {string} from - sender JID
     * @param {Array} args - command arguments
     */
    execute: async (sock, from, args) => {
        await sock.sendMessage(from, {
            text: helpText,
        });
    }
};