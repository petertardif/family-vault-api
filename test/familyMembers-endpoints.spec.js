
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeFamilyMembersArray } = require('../test/familyMembers.fixtures');

describe('Family Members Endpoints', function () {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db)
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('family_members').del());

  afterEach('cleanup', () => db('family_members').del());

  describe('GET /api/family-members', () => {
    context('Given no family members', () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/family-members')
          .expect(200, [])
      })
    });

    context('Given there are family members in the database', () => {
      const testFamilyMembers = makeFamilyMembersArray();

      beforeEach('insert family members', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
      });

      it('responds with 200 and all of the family members', () => {
        return supertest(app)
          .get('/api/family-members')
          .expect(200, testFamilyMembers)
      })
    })
  });

  describe('GET /api/family-members/:familymember_id', () => {
    context(`Given no family members`, () => {
      it(`responds with 404`, () => {
        const familymemberId = 123456;
        return supertest(app)
          .get(`/api/family-members/${familymemberId}`)
          .expect(404, { error: { message: `Family member does not exist` } })
      })
    });

    context('Given there are family members in the database', () => {
      const testFamilyMembers = makeFamilyMembersArray();

      beforeEach('insert family members', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
      });

      it('responds with 200 and the specified family member', () => {
        const familymemberId = 1;
        const expectedFamilyMember= testFamilyMembers[familymemberId - 1]
        return supertest(app)
          .get(`/api/family-members/${familymemberId}`)
          .expect(200, expectedFamilyMember)
      });
    });

    context(`Given an XSS attack on family_members`, () => {
      const maliciousFamilyMember = {
        id: 911,
        first_name: 'Silly rabbit <script>alert("xss");</script>',
        last_name: 'Billy rabbit <script>alert("xss");</script>'
      }

      beforeEach('insert malicious names', () => {
        return db
          .into('family_members')
          .insert(maliciousFamilyMember)
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/family-members/${maliciousFamilyMember.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.first_name).to.eql('Silly rabbit &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
            expect(res.body.last_name).to.eql('Billy rabbit &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
          })
      })
    })
  });

  describe(`POST /api/family-members`, () => {
    it(`creates a family member, responds with 201 and new family member`, () => {
      this.retries(3)
      const newFamilyMember = {
        first_name: 'test first name',
        last_name: 'test last name'
      }

      return supertest(app)
        .post('/api/family-members')
        .send(newFamilyMember)
        .expect(201)
        .expect(res => {
          expect(res.body.first_name).to.eql(newFamilyMember.first_name)
          expect(res.body.last_name).to.eql(newFamilyMember.last_name)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/family-members/${res.body.id}`)
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/family-members/${postRes.body.id}`)
            .expect(postRes.body)
        )
    });

    const requiredFields = ['first_name', 'last_name'];

    requiredFields.forEach(field => {
      const newFamilyMember = {
        first_name: 'Test new first name',
        last_name: 'Test new last name'
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newFamilyMember[field]

        return supertest(app)
          .post('/api/family-members')
          .send(newFamilyMember)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    });
  });

  describe(`DELETE /api/family-members/:familymember_id`, () => {
    context(`Given no family members`, () => {
      it(`responds with 404`, () => {
        const familymemberId = 123456;
        return supertest(app)
          .delete(`/api/family-members/${familymemberId}`)
          .expect(404),{ error: { message: `Family member does not exist`}}
      })
    })

    context('Given there are family members in the database', () => {
      const testFamilyMembers = makeFamilyMembersArray();

      beforeEach('insert family members', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
      });

      it('responds with 204 and removes the family member', () => {
        const idToRemove = 1;
        const expectedFamilyMembers = testFamilyMembers.filter(fm => fm.id !== idToRemove)
        return supertest(app)
          .delete(`/api/family-members/${idToRemove}`)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/family-members`)
              .expect(expectedFamilyMembers)
          )
      })
    })
  });

  describe(`PATCH /api/family-members/:familymember_id`, () => {
    context(`Given no family members`, () => {
      it(`responds with 404`, () => {
        const familymemberId = 123456
        return supertest(app)
          .patch(`/api/family-members/${familymemberId}`)
          .expect(404, { error: { message: `Family member does not exist` } })
      })
    })

    context('Given there are family members in the database', () => { 
      const testFamilyMembers = makeFamilyMembersArray();

      beforeEach('insert family members', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
      });

      it('responds with 204 and updates the family member', () => {
        const idToUpdate = 1
        const updateFamilyMember = {
          first_name: 'updated family member first name ',
          last_name: 'updated family member last name ',
        }
        const expectedFamilyMember = {
          ...testFamilyMembers[idToUpdate - 1],
          ...updateFamilyMember
        }
        return supertest(app)
          .patch(`/api/family-members/${idToUpdate}`)
          .send(updateFamilyMember)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/family-members/${idToUpdate}`)
              .expect(expectedFamilyMember)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 1
        return supertest(app)
          .patch(`/api/family-members/${idToUpdate}`)
          .send({ irrelevantField: 'fumble-fighters' })
          .expect(400, { error: { message: `Request body must contain 'first_name' and 'last_name'.`}
          })
      })
    })
  })
});
