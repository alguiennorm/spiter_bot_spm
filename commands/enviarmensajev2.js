import fs from 'fs/promises';
import path from 'path';

export default {
  name: "enviarmensajev2",
  description: "Envía el mensaje guardado a todos los grupos - Uso: .mensajev2 [segundos]",

  execute: async (sock, from, args) => {
    try {
      const rutaArchivo = path.join('recursos', 'mensajev2.txt');
      const rutaImagen = path.join('recursos', 'mensajev2.jpg');

      // Verificar archivos
      try {
        await fs.access(rutaArchivo);
        await fs.access(rutaImagen);
      } catch (error) {
        await sock.sendMessage(from, { 
          text: `❌ No hay mensaje guardado o error en archivos:\n- ${error.message}\n\nCrea uno primero con *.createmensajev2*` 
        });
        return;
      }

      // Configurar tiempo de espera (default: 1ms)
      const waitTime = args[0] ? parseInt(args[0]) * 1 : 1;
      if (isNaN(waitTime) || waitTime < 1) {
        await sock.sendMessage(from, { 
          text: "❌ Tiempo de espera inválido. Usa: .mensajev2 [segundos]\nEjemplo: .mensajev2 5 (para 5 segundos)" 
        });
        return;
      }

      // Leer contenido
      let texto, imagenBuffer;
      try {
        [texto, imagenBuffer] = await Promise.all([
          fs.readFile(rutaArchivo, 'utf-8'),
          fs.readFile(rutaImagen)
        ]);
      } catch (error) {
        await sock.sendMessage(from, { 
          text: `❌ Error leyendo archivos:\n- TXT: ${rutaArchivo}\n- IMG: ${rutaImagen}\nError: ${error.message}` 
        });
        return;
      }

      // Obtener grupos
      let groupsMetadata;
      try {
        groupsMetadata = await sock.groupFetchAllParticipating();
      } catch (error) {
        await sock.sendMessage(from, { 
          text: `❌ Error obteniendo lista de grupos:\n${error.message}` 
        });
        return;
      }

      const groupJIDs = Object.keys(groupsMetadata);

      if (groupJIDs.length === 0) {
        await sock.sendMessage(from, { 
          text: "❌ No estoy en ningún grupo." 
        });
        return;
      }

      await sock.sendMessage(from, { 
        text: `📤 *INICIANDO ENVÍO MASIVO*\n\n📝 Texto: ${texto.length} caracteres\n🖼️ Con imagen adjunta\n👥 Grupos: ${groupJIDs.length}\n⏱️ Espera: ${waitTime/1000} segundos\n\nTiempo estimado: ${Math.ceil((groupJIDs.length * waitTime/1000) / 60)} minutos` 
      });

      const botNumber = sock.user.id.split(':')[0];
      let stats = { 
        success: 0, 
        fail: 0, 
        skip: 0,
        errors: [] // Array para guardar errores detallados
      };

      for (const [index, jid] of groupJIDs.entries()) {
        let groupName = "Grupo desconocido";
        
        try {
          const groupInfo = await sock.groupMetadata(jid);
          groupName = groupInfo.subject || "Sin nombre";

          // Verificar permisos
          const isAdminOnly = groupInfo.announce === true;
          const botParticipant = groupInfo.participants.find(p => p.id?.includes(botNumber));
          const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

          if (isAdminOnly && !isBotAdmin) {
            stats.skip++;
            stats.errors.push(`⏭️ ${groupName}: Grupo solo para admins (bot no es admin)`);
            continue;
          }

          // Enviar mensaje
          await sock.sendMessage(jid, {
            image: imagenBuffer,
            caption: texto
          });

          stats.success++;
          
          // Progreso cada 5 grupos o en el último
          if (stats.success % 5 === 0 || index === groupJIDs.length - 1) {
            await sock.sendMessage(from, {
              text: `📊 Progreso: ${stats.success}/${groupJIDs.length} grupos\n✅ Éxitos: ${stats.success}\n❌ Fallos: ${stats.fail}\n⏭️ Saltados: ${stats.skip}`
            });
          }

          // Esperar (excepto último envío)
          if (index < groupJIDs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

        } catch (error) {
          stats.fail++;
          const errorMsg = `❌ ${groupName} (${jid}): ${error.message}`;
          stats.errors.push(errorMsg);
          console.error(`Error en grupo ${groupName}:`, error);
          
          // Notificar errores críticos inmediatamente
          if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Not authorized')) {
            await sock.sendMessage(from, {
              text: `🚨 Error crítico en ${groupName}:\n${error.message}`
            });
          }
        }
      }

      // Resumen final DETALLADO
      let resumen = `🎯 *ENVÍO COMPLETADO*\n\n`;
      resumen += `✅ Enviados: ${stats.success}\n`;
      resumen += `❌ Fallidos: ${stats.fail}\n`;
      resumen += `⏭️ Saltados: ${stats.skip}\n`;
      resumen += `👥 Total: ${groupJIDs.length}\n\n`;

      // Mostrar primeros 5 errores si hay fallos
      if (stats.fail > 0 || stats.skip > 0) {
        resumen += `📋 *DETALLES DE ERRORES:*\n`;
        
        const totalErrores = stats.errors.slice(0, 10); // Mostrar máximo 10 errores
        totalErrores.forEach(error => {
          resumen += `• ${error}\n`;
        });

        if (stats.errors.length > 10) {
          resumen += `\n... y ${stats.errors.length - 10} errores más.`;
        }
      }

      await sock.sendMessage(from, { text: resumen });

      // Guardar log completo en archivo si hay muchos errores
      if (stats.errors.length > 5) {
        const logDir = path.join('logs');
        try {
          await fs.mkdir(logDir, { recursive: true });
          const logFile = path.join(logDir, `errores-envio-${Date.now()}.txt`);
          const logContent = `ENVÍO MASIVO - ${new Date().toISOString()}\n\n` +
                           `Resumen: ${stats.success}✅ ${stats.fail}❌ ${stats.skip}⏭️\n\n` +
                           `ERRORES DETALLADOS:\n${stats.errors.join('\n')}`;
          
          await fs.writeFile(logFile, logContent, 'utf-8');
          await sock.sendMessage(from, {
            text: `📄 Se guardó log completo en: ${logFile}`
          });
        } catch (logError) {
          console.error('Error guardando log:', logError);
        }
      }

    } catch (err) {
      console.error("❌ Error general:", err);
      await sock.sendMessage(from, {
        text: `⚠️ Error general del sistema:\n${err.message}\n\nStack: ${err.stack}`
      });
    }
  }
};