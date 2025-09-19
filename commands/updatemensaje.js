import fs from 'fs';
import path from 'path';

export default {
  name: "updatemensaje",
  description: "update the content of mensaje.txt",

  /**
   * @param {object} sock - Instancia del socket de WhatsApp
   * @param {string} from - JID del remitente
   * @param {Array} args - Argumentos del comando (nuevo mensaje)
   */
  async execute(sock, from, args) {
    const rutaArchivo = path.join('recursos', 'mensaje.txt');

    // Si no hay argumentos, mostrar error
    if (args.length === 0) {
      await sock.sendMessage(from, {
        text: `⚠️ Debes escribir el nuevo mensaje.\n\n📌 *Ejemplo: 
*.updatemensaje* LLEVATE SPOTIFY AL 2X1 SOLO HOY
Pasale con el spiter...`,
      });
      return;
    }

    // Verificar si el archivo existe
    if (!fs.existsSync(rutaArchivo)) {
      await sock.sendMessage(from, {
        text: "❌ El archivo no existe. Primero crea uno con *.createmensaje*",
      });
      return;
    }

    // Unir argumentos y escribir en el archivo
    const nuevoContenido = args.join(' ');
    fs.writeFileSync(rutaArchivo, nuevoContenido, 'utf-8');

    // Confirmar la actualización
    await sock.sendMessage(from, {
      text: "✅ El contenido del mensaje ha sido *actualizado* correctamente. Puedes verlo con *.mensaje*",
    });
  },
};
