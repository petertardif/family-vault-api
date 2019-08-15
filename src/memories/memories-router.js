const path = require('path');
const express = require('express');
const xss = require('xss');
const MemoriesJson = express.json();
const MemoriesRouter = express.Router();
const MemoriesService = require('./memories-service');

const serailizeMemory = memory => ({
  id: memory.id,
  memory_title: xss(memory.memory_title),
  memory_date: memory.memory_date,
  memory_desc: xss(memory.memory_desc),
  media_url: memory.media_url,
  familymember_id: memory.familymember_id,
})

MemoriesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    MemoresService.getAllMemories(knexInstance)
      .then(memories => {
        res.json(memories);
      })
      .catch(next)
  })
  .post(MemoriesJson, (req, res, next) => {
    const { memory_title, memory_date, memory_desc, media_url, familymember_id } = req.body;
    const newMemory = { memory_title, memory_date, memory_desc, media_url, familymember_id };

    for (const [key, value] of Object.entries(newMemory)) {
      if (value == null) {
        // logger.error(`Title and Content are required.`)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    
    MemoriesService.insertMemories(req.app.get('db'), newMemory)
      .then(note => {
        res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${note.id}`))
        .json(serializeNote(note))
      })
      .catch(next)
  })

MemoriesRouter
  .route('/:memory_id')
  .all((req, res, next) => {
    const { note_id } = req.params
    NotesService.getById(
      req.app.get('db'),
      note_id
    )
      .then(note => {
        if (!note) {
          // logger.error(`Note with id ${note_id} not found.`)
          return res.status(404).json({
            error: { message: `Note does not exist`}
          })
        }
        res.note = note
        next()
      })
      .catch(next)
  })
  .get((req, res) => {
    res.json(serializeNote(res.note))
  })
  .delete((req, res, next) => {
    const { note_id } = req.params
    NotesService.deleteNotes(
      req.app.get('db'),
      note_id
    )
      .then(() => {
        // logger.info(`Note with id ${note_id} deleted.`)
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(NotesJson, (req, res, next) => {
    const { note_title, content } = req.body;
    const noteToUpdate = { note_title, content }
    
    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: { message: `Request body must contain either 'note_title' or 'content'`}
      })
    }

    NotesService.updateNotes(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = MemoriesRouter;