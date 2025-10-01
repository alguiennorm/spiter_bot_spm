// commands/deletemensajev2.js
import fs from 'fs';
import path from 'path';

export default {
  name: "deletemensajev2",
  description: "Elimina el mensaje guardado",

  async execute(sock, from, args) {
    const rutaArchivo = path.join('recursos', 'mensajev2.txt');
    const rutaImagen = path.join('recursos', 'mensajev2.jpg');

    // Verificar si existe
    if (!fs.existsSync(rutaArchivo) && !fs.existsSync(rutaImagen)) {
      await sock.sendMessage(from, {
        text: "ℹ️ No hay ningún mensaje para eliminar.",
      });
      return;
    }

    try {
      // Eliminar archivos si existen
      if (fs.existsSync(rutaArchivo)) {
        fs.unlinkSync(rutaArchivo);
      }
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }

      await sock.sendMessage(from, {
        text: "✅ *Mensaje eliminado correctamente.*\n\nUsa *.createmensajev2* para crear uno nuevo."
      });

    } catch (error) {
      console.error('❌ Error al eliminar:', error);
      await sock.sendMessage(from, {
        text: "❌ Error al eliminar el mensaje. Verifica los permisos de archivos."
      });
    }
  },
};