import fs from 'fs';
import path from 'path';

export default {
  name: "createmensaje",
  description: "Crea el archivo mensaje.txt si no existe",

  /**
   * @param {object} sock - WhatsApp socket instance
   * @param {string} from - Sender JID
   * @param {Array} args - Argumentos del mensaje
   */
  async execute(sock, from, args) {
    const rutaArchivo = path.join('recursos', 'mensaje.txt');

    // Verificar si ya existe
    if (fs.existsSync(rutaArchivo)) {
      await sock.sendMessage(from, {
        text: "⚠️ El archivo ya existe. Usa *.updatemensaje* para actualizarlo.",
      });
      return;
    }

    // Verificar si la carpeta recursos existe, si no, crearla
    const dir = path.dirname(rutaArchivo);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Contenido por defecto o desde argumentos
    const contenido = args.length > 0
      ? args.join(' ')
      : 'Este es el mensaje por defecto. Puedes actualizarlo con *.updatemensaje*';

    // Crear el archivo
    fs.writeFileSync(rutaArchivo, contenido, 'utf-8');

    // Confirmar
    await sock.sendMessage(from, {
      text: "✅ El archivo *mensaje.txt* ha sido creado correctamente. puedes verlo con *.mensaje* y posteriormente actualizarlo con *.updatemensaje*",
    });
  },
};
