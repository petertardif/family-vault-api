const FamilyMembersService = {
  getAllFamilyMembers(knex) {
    return knex.select('*').from('family_members')
  },
  insertFamilyMembers(knex,newFamilyMember) {
    return knex
      .insert(newFamilyMember)
      .into('family_members')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  getById(knex,id) {
    return knex
    .select('*')
    .from('family_members')
    .where('id', id)
    .first()
  },
  deleteFamilyMembers(knex, id) {
    return knex('family_members')
      .where({ id })
      .delete()
  },
  updateFamilyMembers(knex, id, newFamilyMemberFields) {
    return knex('family_members')
      .where({ id })
      .update(newFamilyMemberFields)
  },
 }
 
 module.exports = FamilyMembersService;