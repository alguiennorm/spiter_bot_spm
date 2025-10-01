// commands/updatemensajev2.js
import fs from 'fs';
import path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: "updatemensajev2",
  description: "Actualiza el mensaje existente con nueva imagen y texto",

  async execute(sock, from, args, m) {
    const rutaArchivo = path.join('recursos', 'mensajev2.txt');
    const rutaImagen = path.join('recursos', 'mensajev2.jpg');

    // Verificar si existe para actualizar
    if (!fs.existsSync(rutaArchivo) || !fs.existsSync(rutaImagen)) {
      await sock.sendMessage(from, {
        text: "⚠️ No hay mensaje para actualizar. Crea uno primero con *.createmensajev2*",
      });
      return;
    }

    // Crear carpeta si no existe (por si acaso)
    const dir = path.dirname(rutaArchivo);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Verificar si el mensaje es una imagen
    if (m.message?.imageMessage) {
      console.log('🖼️ Actualizando mensaje con nueva imagen...');

      // Obtener texto del caption
      const caption = m.message.imageMessage.caption || '';
      
      // Verificar que el caption contenga el comando
      if (!caption.startsWith('.updatemensajev2')) {
        await sock.sendMessage(from, {
          text: "❌ Debes escribir el comando *.updatemensajev2* en el *PIE DE FOTO* de la imagen."
        });
        return;
      }

      try {
        // Extraer el texto (remover el comando)
        const texto = caption.replace(/^\.updatemensajev2\s*/, '').trim();
        
        if (!texto) {
          await sock.sendMessage(from, {
            text: "❌ Debes proporcionar un texto después del comando.\nEjemplo: .updatemensajev2 Nuevo texto de bienvenida"
          });
          return;
        }

        // Descargar la nueva imagen
        console.log('📥 Descargando nueva imagen...');
        const buffer = await downloadMediaMessage(
          m, 
          'buffer', 
          {},
          {
            logger: console,
            reuploadRequest: sock.updateMediaMessage
          }
        );

        if (buffer) {
          console.log(`✅ Nueva imagen descargada. Tamaño: ${buffer.length} bytes`);
          
          // Sobrescribir archivos existentes
          fs.writeFileSync(rutaImagen, buffer);
          fs.writeFileSync(rutaArchivo, texto, 'utf-8');

          await sock.sendMessage(from, {
            text: `✅ *Mensaje actualizado exitosamente!*\n\n📝 *Nuevo texto:* ${texto}\n🖼️ *Imagen:* Actualizada\n\nUsa *.mensajev2* para ver el mensaje actualizado`
          });

        } else {
          throw new Error('No se pudo descargar la nueva imagen');
        }

      } catch (error) {
        console.error('❌ Error al actualizar:', error);
        await sock.sendMessage(from, {
          text: "❌ Error al actualizar el mensaje. Intenta nuevamente."
        });
      }
    } else {
      await sock.sendMessage(from, {
        text: "📌 *Para actualizar:*\n\n1. 📸 Envía una nueva imagen\n2. 💬 En el *PIE DE FOTO* escribe:\n.updatemensajev2 nuevo texto aquí"
      });
    }
  },
};