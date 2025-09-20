import fs from 'fs/promises'

export default {
  name: "enviarmensaje",
  description: "Envía el mensaje de recursos/mensaje.txt a todos los grupos con espera de 10s entre cada envío.",

  execute: async (sock, from, args) => {
    try {
      // Leer el archivo de mensaje
      const mensaje = await fs.readFile('recursos/mensaje.txt', 'utf-8')

      // Obtener todos los grupos
      const groupsMetadata = await sock.groupFetchAllParticipating()
      const groupJIDs = Object.keys(groupsMetadata)

      if (groupJIDs.length === 0) {
        await sock.sendMessage(from, { text: "❌ No estoy en ningún grupo para enviar el mensaje." })
        return
      }

      await sock.sendMessage(from, { text: `✅ Enviando mensaje a ${groupJIDs.length} grupos. Esto tomará algo de tiempo...` })

      const botNumber = sock.user.id.split(':')[0] // Número del bot

      for (const [index, jid] of groupJIDs.entries()) {
        const groupInfo = await sock.groupMetadata(jid)
        const groupName = groupInfo.subject || "Grupo sin nombre"

        const isAdminOnly = groupInfo.announce === true // "announce" true = solo admins pueden enviar

        // Buscar al bot en la lista de participantes
        const botParticipant = groupInfo.participants.find(p => p.id?.includes(botNumber))
        const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin'

        if (isAdminOnly && !isBotAdmin) {
          await sock.sendMessage(from, {
            text: `⚠️ No se puede enviar mensaje a *${groupName}* (${jid}): el grupo es solo para admins y el bot no es admin.`
          })
        } else {
          try {
            await sock.sendMessage(jid, { text: mensaje })
            await sock.sendMessage(from, {
              text: `✅ Mensaje enviado al grupo: *${groupName}* (${jid})`
            })
          } catch (error) {
            await sock.sendMessage(from, {
              text: `❌ Error al enviar mensaje a *${groupName}* (${jid}): ${error.message}`
            })
          }
        }

        // Esperar 10 segundos antes del siguiente envío
        if (index < groupJIDs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000))
        }
      }

      await sock.sendMessage(from, {
        text: "✅ Mensaje enviado a todos los grupos válidos."
      })
    } catch (err) {
      console.error("❌ Error en el comando enviarmensaje:", err)
      await sock.sendMessage(from, {
        text: "⚠️ Hubo un error al intentar enviar el mensaje a los grupos."
      })
    }
  }
}
