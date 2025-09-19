import fs from 'fs';
import path from 'path';

export default {
  name: "mensaje",
  description: "See the message saved",

  /**
   * @param {object} sock - WhatsApp socket instance
   * @param {string} from - Sender JID
   * @param {Array} args - Command arguments
   */
  async execute(sock, from, args) {
    const rutaArchivo = path.join('recursos', 'mensaje.txt');

    // Verificar si existe
    if (!fs.existsSync(rutaArchivo)) {
      await sock.sendMessage(from, {
        text: "⚠️ El mensaje no existe. Crea uno con *.createmensaje*",
      });
      return;
    }

    // Leer contenido del archivo
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');

    // Enviar el contenido
    await sock.sendMessage(from, {
      text: `📝 *Mensaje guardado:*\n\n${contenido}`,
    });
  },
};