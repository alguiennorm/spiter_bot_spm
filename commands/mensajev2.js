import fs from 'fs';
import path from 'path';

export default {
  name: "mensajev2",
  description: "Envía el mensaje guardado con imagen y texto",

  /**
   * @param {object} sock - WhatsApp socket instance
   * @param {string} from - Sender JID
   * @param {Array} args - Command arguments
   */
  async execute(sock, from, args) {
    const rutaArchivo = path.join('recursos', 'mensajev2.txt');
    const rutaImagen = path.join('recursos', 'mensajev2.jpg');

    // Verificar si existen ambos archivos
    if (!fs.existsSync(rutaArchivo) || !fs.existsSync(rutaImagen)) {
      await sock.sendMessage(from, {
        text: "⚠️ No hay ningún mensaje guardado. Crea uno con *.createmensajev2*",
      });
      return;
    }

    try {
      // Leer contenido del archivo de texto
      const texto = fs.readFileSync(rutaArchivo, 'utf-8');
      
      // Leer la imagen como buffer
      const imagenBuffer = fs.readFileSync(rutaImagen);

      // Enviar la imagen con el texto como caption
      await sock.sendMessage(from, {
        image: imagenBuffer,
        caption: texto
      });

      console.log(`✅ Mensaje enviado a ${from}`);

    } catch (error) {
      console.error('❌ Error al enviar el mensaje:', error);
      await sock.sendMessage(from, {
        text: "❌ Error al enviar el mensaje guardado. Verifica que los archivos no estén corruptos."
      });
    }
  },
};