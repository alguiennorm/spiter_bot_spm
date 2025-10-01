// commands/createmensajev2.js
import fs from 'fs';
import path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: "createmensajev2",
  description: "Crea un mensaje con imagen y texto - Usa el comando en el pie de foto de la imagen",

  async execute(sock, from, args, m) {
    const rutaArchivo = path.join('recursos', 'mensajev2.txt');
    const rutaImagen = path.join('recursos', 'mensajev2.jpg');

    // Verificar si ya existe
    if (fs.existsSync(rutaArchivo) || fs.existsSync(rutaImagen)) {
      await sock.sendMessage(from, {
        text: "⚠️ El mensaje ya existe. Usa *.updatemensajev2* para actualizarlo.",
      });
      return;
    }

    // Crear carpeta si no existe
    const dir = path.dirname(rutaArchivo);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Verificar si el mensaje es una imagen
    if (m.message?.imageMessage) {
      console.log('🖼️ Se ha recibido un mensaje de imagen. Buscando la imagen para descargar...');

      // Obtener texto del caption
      const caption = m.message.imageMessage.caption || '';
      
      // Verificar que el caption contenga el comando
      if (!caption.startsWith('.createmensajev2')) {
        await sock.sendMessage(from, {
          text: "❌ Debes escribir el comando *.createmensajev2* en el *PIE DE FOTO* de la imagen, no como mensaje separado."
        });
        return;
      }

      try {
        // Extraer el texto (remover el comando)
        const texto = caption.replace(/^\.createmensajev2\s*/, '').trim();
        
        if (!texto) {
          await sock.sendMessage(from, {
            text: "❌ Debes proporcionar un texto después del comando.\nEjemplo: .createmensajev2 Bienvenidos al grupo"
          });
          return;
        }

        // ADAPTACIÓN DEL EJEMPLO: Descargar la imagen usando el método más confiable
        console.log('📥 Intentando descargar la imagen...');
        
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
          console.log(`✅ Imagen descargada con éxito. Tamaño: ${buffer.length} bytes`);
          
          // Guardar imagen y texto
          fs.writeFileSync(rutaImagen, buffer);
          fs.writeFileSync(rutaArchivo, texto, 'utf-8');

          await sock.sendMessage(from, {
            text: `✅ *Mensaje creado exitosamente!*\n\n📝 *Texto:* ${texto}\n🖼️ *Imagen:* ${buffer.length} bytes guardados\n📁 *Ubicación:* recursos/mensaje.jpg\n\nUsa *.mensajev2* para ver tu mensaje`
          });

          console.log('💾 Mensaje e imagen guardados correctamente en recursos/');
        } else {
          throw new Error('No se pudo descargar la imagen');
        }

      } catch (error) {
        console.error('❌ Error al descargar la imagen:', error);
        await sock.sendMessage(from, {
          text: "❌ Error al descargar la imagen. Intenta enviarla nuevamente o verifica la conexión."
        });
      }
    } else {
      // Si no es una imagen, mostrar instrucciones
      await sock.sendMessage(from, {
        text: "📌 *FORMA CORRECTA DE USAR:*\n\n1. 📸 Toma o selecciona una imagen\n2. 💬 En el *PIE DE FOTO* escribe:\n.createmensajev2 tu texto aquí\n3. ✅ Envía el mensaje\n\n*Ejemplo:* En el pie de foto de la imagen escribe:\n.createmensajev2 Bienvenidos a nuestro grupo"
      });
    }
  },
};