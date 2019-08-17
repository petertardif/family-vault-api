
const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeMemoriesArray } = require('../test/memories.fixtures');
const { makeFamilyMembersArray } = require('../test/familyMembers.fixtures.js');

describe('Memories Endpoints', function () {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db)
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('memories').del());
  before('clean the table', () => db('family_members').del());

  afterEach('cleanup', () => db('memories').del());
  afterEach('cleanup', () => db('family_members').del());

  describe('GET /api/memories', () => {
    context('Given no memories', () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/memories')
          .expect(200, [])
      })
    });

    context('Given there are memories in the database', () => {
      const testFamilyMembers = makeFamilyMembersArray();
      const testMemories = makeMemoriesArray();

      beforeEach('insert family members', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
          .then(() => {
            return db
            .into('memories')
            .insert(testMemories)
          })
      });

      it('responds with 200 and all of the memories', () => {
        return supertest(app)
          .get('/api/memories')
          .expect(200, testMemories)
      })
    })
  });

  describe('GET /memories/:memories_id', () => {
    context(`Given no memories`, () => {
      it(`responds with 404`, () => {
        const memoryId = 123456;
        return supertest(app)
          .get(`/api/memories/${memoryId}`)
          .expect(404, { error: { message: `Memory does not exist` } })
      })
    });

    context('Given there are memories in the database', () => {
      const testFamilyMembers = makeFamilyMembersArray();
      const testMemories = makeMemoriesArray();

      beforeEach('insert family members', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
          .then(() => {
            return db
            .into('memories')
            .insert(testMemories)
          })
      });

      it('responds with 200 and the specified memory', () => {
        const memoryId = 3;
        const expectedMemory = testMemories[memoryId - 1]
        return supertest(app)
          .get(`/api/memories/${memoryId}`)
          .expect(200, expectedMemory)
      });
    });

    context(`Given an XSS attack memory`, () => {
      const testFamilyMembers = makeFamilyMembersArray();
      const maliciousMemory = {
        id: 911,
        memory_title: 'Silly rabbit <script>alert("xss");</script>',
        memory_date: '2019-01-03T00:00:00.000Z',
        familymember_id: 1,
        memory_desc: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        media_url: 'https://www.google.com',
        date_updated: '2015-01-03T00:00:00.000Z'
      }

      beforeEach('insert family members and malicious memory', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
          .then(() => {
            return db
            .into('memories')
            .insert([ maliciousMemory ])
          })
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/memories/${maliciousMemory.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.memory_title).to.eql('Silly rabbit &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
            expect(res.body.memory_desc).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
          })
      })
    })
  });

  describe(`POST /api/memories`, () => {

    beforeEach('insert memories', () => {
      const testFamilyMembers = makeFamilyMembersArray();
      return db
        .into('family_members')
        .insert(testFamilyMembers)
    });

    it(`creates a memory, responding with 201 and the new memory`, function() {
      this.retries(3)
      const testFamilyMembers = makeFamilyMembersArray();
      const testFamilyMember = testFamilyMembers[0]
      const newMemory = {
        memory_title: 'Test new title',
        memory_desc: 'Here we go',
        familymember_id: testFamilyMember.id,
        media_url: 'https://www.memory.com',
        memory_date: '2015-01-03T00:00:00.000Z',
      }
      return supertest(app)
        .post('/api/memories')
        .send(newMemory)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id')
          expect(res.body.memory_desc).to.eql(newMemory.memory_desc)
          expect(res.body.familymember_id).to.eql(newMemory.familymember_id)
          expect(res.body.media_url).to.eql(newMemory.media_url)
          expect(res.headers.location).to.eql(`/api/memories/${res.body.id}`)
          const expectedDate2 = new Date().toLocaleString()
          const actualDate2 = new Date(res.body.date_updated).toLocaleString()
          expect(actualDate2).to.eql(expectedDate2)
        })
    })

    const requiredFields = ['memory_title', 'memory_desc', 'memory_date'];

    requiredFields.forEach(field => {
      const newMemory = {
        memory_title: 'Test new memory',
        memory_desc: 'Test new memory content...',
        memory_date: '2018-01-03T00:00:00.000Z',
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newMemory[field]

        return supertest(app)
          .post('/api/memories')
          .send(newMemory)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    });
  });

  describe(`DELETE /api/memories/:memory_id`, () => {
    context(`Given no memories`, () => {
      it(`responds with 404`, () => {
        const memoryId = 123456;
        return supertest(app)
          .delete(`/api/memories/${memoryId}`)
          .expect(404,{ error: { message: `Memory does not exist`}})
      })
    })

    context('Given there are memories in the database', () => {
      const testFamilyMembers = makeFamilyMembersArray();
      const testMemories = makeMemoriesArray();

      beforeEach('insert family members and memories', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
          .then(() => {
            return db
            .into('memories')
            .insert(testMemories)
          })
      });

      it('responds with 204 and removes the memories', () => {
        const idToRemove = 2;
        const expectedMemories = testMemories.filter(memory => memory.id !== idToRemove)
        return supertest(app)
          .delete(`/api/memories/${idToRemove}`)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/memories`)
              .expect(expectedMemories)
          )
      })
  })
});

  describe(`PATCH /api/memories/:memory_id`, () => {
    context(`Given no memories`, () => {
      it(`responds with 404`, () => {
        const memoryId = 123456
        return supertest(app)
          .patch(`/api/memories/${memoryId}`)
          .expect(404, { error: { message: `Memory does not exist` } })
      })
    })

    context('Given there are memories in the database', () => { 
      const testFamilyMembers = makeFamilyMembersArray();
      const testMemories = makeMemoriesArray();

      beforeEach('insert family members and memories', () => {
        return db
          .into('family_members')
          .insert(testFamilyMembers)
          .then(() => {
            return db
            .into('memories')
            .insert(testMemories)
          })
      });

      it('responds with 204 and updates the memory', () => {
        const idToUpdate = 2
        const updateMemory = {
          memory_title: 'Test new title',
          memory_desc: 'Here we go',
          familymember_id: 1,
          media_url: 'https://www.memory.com',
        }
        const expectedMemory = {
          ...testMemories[idToUpdate - 1],
          ...updateMemory
        }
        return supertest(app)
          .patch(`/api/memories/${idToUpdate}`)
          .send(updateMemory)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/memories/${idToUpdate}`)
              .expect(expectedMemory)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/memories/${idToUpdate}`)
          .send({ irrelevantField: 'foo-fighters' })
          .expect(400, { error: { message: `Request body must contain 'title', 'date', 'description', 'URL', or 'family member'.`}
          })
      })

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateMemory = {
          memory_title: 'updated memory title',
        }
        const expectedMemory = {
          ...testMemories[idToUpdate - 1],
          ...updateMemory
        }

        return supertest(app)
          .patch(`/api/memories/${idToUpdate}`)
          .send({
            ...updateMemory,
            fieldToIgnore: 'should not be in the GET request'
          })
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/memories/${idToUpdate}`)
              .expect(expectedMemory)
          )
      })
    })
  })
  
});