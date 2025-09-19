export default {
  name: "grupos",
  description: "Lista los ID y nombres de todos los grupos en los que estoy.",

  execute: async (sock, from, args) => {
    try {
      const groupsMetadata = await sock.groupFetchAllParticipating()
      const groupJIDs = Object.keys(groupsMetadata)

      if (groupJIDs.length === 0) {
        await sock.sendMessage(from, { text: "❌ No estoy en ningún grupo." })
        return
      }

      const message = `📋 *Grupos donde estoy:*\n\n` + groupJIDs.map((jid, i) => {
        const groupName = groupsMetadata[jid].subject || "Nombre no disponible"
        return `*${i + 1}.* ${groupName} — \`${jid}\``
      }).join("\n")

      await sock.sendMessage(from, { text: message })
    } catch (err) {
      console.error("❌ Error al obtener los grupos:", err)
      await sock.sendMessage(from, { text: "⚠️ Error al obtener los grupos." })
    }
  }
}
