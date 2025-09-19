
/**
 * Welcome message.
 * Usage: .start
 */
const startText = `
👋 ¡Bienvenido al *Bot de Ads*!

Este bot te ayuda a promocionarte en grupos de manera más rápida 🚀

📜 Para ver el menú de comandos, escribe: *.cmds*
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
      text: startText,
    });
  }
};