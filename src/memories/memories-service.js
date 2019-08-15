
const MemoriesService = {
  getAllMemories(knex) {
    return knex.select('*').from('memories')
  },
  insertMemories(knex,newMemory) {
    return knex
      .insert(newMemory)
      .into('memories')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  getById(knex,id) {
    return knex
    .select('*')
    .from('memories')
    .where('id', id)
    .first()
  },
  deleteMemories(knex, id) {
    return knex('memories')
      .where({ id })
      .delete()
  },
  updateMemories(knex, id, newMemoryFields) {
    return knex('memories')
      .where({ id })
      .update(newMemoryFields)
  },
}

module.exports = MemoriesService;