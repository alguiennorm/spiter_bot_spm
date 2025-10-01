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
*👷🏻 .createmensaje*    → Crea tu mensaje de spam
*💬 .mensaje*         → Muestra el mensaje guardado  
*✏️ .updatemensaje*  → Actualiza el mensaje guardado 
*🗑 .deletemensaje*   → Elimina el mensaje guardado
*📤 .enviarmensaje*   → Envía el mensaje a todos los grupos

*🕹 V2 commands con imagen 🕹*

*👷🏻 .createmensajev2*   → Crear mensaje de spam con imagen
*💬 .mensajev2*  → Muestra tu mensaje guardado
*✏️ .updatemensaje2*  → Actualiza tu mensaje guaradado
*🗑  .deletemensaje2* → Elimina el mensaje guardado
*📤 .enviarmensaje2* → Envia tu mensaje a todos los grupos
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
