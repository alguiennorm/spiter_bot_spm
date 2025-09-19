/**
 * Menu commmand
 * Usage: .cmds
 */

const cmdsText = `
*🛠️ Bienvenido al menú:*

*✅ .start*           → Inicia el bot  
*📜 .cmds*            → Muestra este menú  
*👥 .grupos*          → Muestra los grupos disponibles  
*🆘 .help*            → Comando de ayuda  
*💬 .mensaje*         → Muestra el mensaje guardado  
*✏️ .updatemensaje*  → Actualiza el mensaje guardado  
*📤 .enviarmensaje*   → Envía el mensaje a todos los grupos
`;

export default {
    name: "cmds",
    description: "see the menu",
     /**
     * Sends a help message listing all commands.
     * @param {object} sock - WhatsApp socket instance
     * @param {string} from - Sender JID
     * @param {Array} args - Command arguments
     */

    execute: async (sock, from, args) => {
        await sock.sendMessage(from, {
            text: cmdsText,
        });
    }

};
