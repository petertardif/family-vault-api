const path = require('path');
const express = require('express');
const xss = require('xss');
const FamilyMembersJson = express.json();
const FamilyMembersRouter = express.Router();
const FamilyMembersService = require('./family-members.service')

// helper functiont that creates an object of a family member to store in the DB and also prevents cross site scripting.
const serializeFamilyMember =  familymember => ({
  id: familymember.id,
  first_name: xss(familymember.first_name),
  last_name: xss(familymember.last_name),
})

// GET request for all family members and POST for adding a new family member
FamilyMembersRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    FamilyMembersService.getAllFamilyMembers(knexInstance)
      .then(familymembers => {
        res.json(familymembers);
      })
      .catch(next)
  })
  .post(FamilyMembersJson, (req, res, next) => {
    const { first_name, last_name } = req.body;
    const newFamilyMember = { first_name, last_name } ;

    for (const [key, value] of Object.entries(newFamilyMember)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    FamilyMembersService.insertFamilyMembers(req.app.get('db'), newFamilyMember)
      .then(familymembers => {
        res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${familymembers.id}`))
        .json(familymembers)
      })
      .catch(next)
  })

FamilyMembersRouter
  .route('/:familymember_id')
  .all((req, res, next) => {
    const { familymember_id } = req.params
    FamilyMembersService.getById(
      req.app.get('db'),
      familymember_id
    )
      .then(familymember => {
        if (!familymember) {
          return res.status(404).json({
            error: { message: `Family member does not exist`}
          })
        }
        res.familymember = familymember
        next()
      })
      .catch(next)
  })
  .get((req, res) => {
    res.json(serializeFamilyMember(res.familymember))
  })
  // TODO: need to still implement this delete functionality on the client
  .delete((req, res, next) => {
    const { familymember_id } = req.params
    FamilyMembersService.deleteFamilyMembers(
      req.app.get('db'),
      familymember_id
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

  // TODO: still need to implement this update function on the front end.
  .patch(FamilyMembersJson, (req, res, next) => {
    const { first_name, last_name } = req.body;
    const familymemberToUpdate = { first_name, last_name }
    
    const numberOfValues = Object.values(familymemberToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: { message: `Request body must contain 'first_name' and 'last_name'.`}
      })
    }

    FamilyMembersService.updateFamilyMembers(
      req.app.get('db'),
      req.params.familymember_id,
      familymemberToUpdate
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = FamilyMembersRouter;