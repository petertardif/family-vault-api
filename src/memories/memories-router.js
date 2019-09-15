const path = require('path');
const express = require('express');
const xss = require('xss');
const MemoriesJson = express.json();
const MemoriesRouter = express.Router();
const MemoriesService = require('./memories-service');

// creates a helper function to create an object of the member and prevents cross site scripting.
const serializeMemory = memory => ({
  id: memory.id,
  memory_title: xss(memory.memory_title),
  memory_date: memory.memory_date,
  memory_desc: xss(memory.memory_desc),
  media_url: memory.media_url,
  familymember_id: memory.familymember_id,
  date_updated: memory.date_updated
})

// GET request to pull back all memories and POST request to add a new memory
MemoriesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    MemoriesService.getAllMemories(knexInstance)
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
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    
    MemoriesService.insertMemories(req.app.get('db'), newMemory)
      .then(memory => {
        res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${memory.id}`))
        .json(serializeMemory(memory))
      })
      .catch(next)
  })

// Individual memory requests
MemoriesRouter
  .route('/:memory_id')
  .all((req, res, next) => {
    const { memory_id } = req.params
    MemoriesService.getById(
      req.app.get('db'),
      memory_id
    )
      .then(memory => {
        if (!memory) {
          return res.status(404).json({
            error: { message: `Memory does not exist`}
          })
        }
        res.memory = memory
        next()
      })
      .catch(next)
  })
  .get((req, res) => {
    res.json(serializeMemory(res.memory))
  })
  .delete((req, res, next) => {
    const { memory_id } = req.params
    MemoriesService.deleteMemories(
      req.app.get('db'),
      memory_id
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

  // TODO: still need to implement this CRUD Operation for updating
  .patch(MemoriesJson, (req, res, next) => {
    const { memory_title, memory_date, memory_desc, media_url, familymember_id } = req.body;
    const memoryToUpdate = { memory_title, memory_date, memory_desc, media_url, familymember_id }
    
    const numberOfValues = Object.values(memoryToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: { message: `Request body must contain 'title', 'date', 'description', 'URL', or 'family member'.`}
      })
    }

    MemoriesService.updateMemories(
      req.app.get('db'),
      req.params.memory_id,
      memoryToUpdate
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = MemoriesRouter;