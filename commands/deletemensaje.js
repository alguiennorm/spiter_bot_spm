import fs from 'fs';
import path from 'path';

export default {
  name: "deletemensaje",
  description: "Delete the file mensaje.txt",

  /**
   * @param {object} sock - Instancia del socket de WhatsApp
   * @param {string} from - JID del remitente
   * @param {Array} args - Argumentos del comando
   */
  async execute(sock, from, args) {
    const rutaArchivo = path.join('recursos', 'mensaje.txt');

    // Verificar si el archivo existe
    if (!fs.existsSync(rutaArchivo)) {
      await sock.sendMessage(from, {
        text: "❌ No hay mensaje guardado que borrar.",
      });
      return;
    }

    // Eliminar el archivo
    try {
      fs.unlinkSync(rutaArchivo);
      await sock.sendMessage(from, {
        text: "✅ El mensaje fue eliminado correctamente.",
      });
    } catch (error) {
      await sock.sendMessage(from, {
        text: "❌ Ocurrió un error al intentar eliminar el mensaje.",
      });
      console.error("Error al eliminar mensaje.txt:", error);
    }
  },
};