
/**
 * Welcome message.
 * Usage: .start
 */
const helpText = `
✨👋 *¡BIENVENIDO AL BOT DE TAREAS!* 📚✨

Este bot te tira paro 💡 recordándote qué tareas tienes y cuándo se entregan.  
✅ Organízate mejor  
✅ Evita que se te pase la fecha  
✅ Ten todo a la mano  

👉 Manda el comando .cmd para ver el menú de ayuda 🚀
`;

export default {
  name: "start",
  description: "welcome message or start.",
  /**
   * Sends a help message listing all commands.
   * @param {object} sock - WhatsApp socket instance
   * @param {string} from - Sender JID
   * @param {Array} args - Command arguments
   */
  execute: async (sock, from, args) => {
    await sock.sendMessage(from, {
      text: helpText,
    });
  }
};