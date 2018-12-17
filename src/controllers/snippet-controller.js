const Snippet = require('../models/snippet.js')
const mongoose = require('mongoose')
const uuid = require('uuid/v4')
/* Controller for snippets, preforms create,delete,update,find
operations in mongodb for snippets */
class SnippetController {
  constructor () {
    this.snippetmodel = mongoose.model('snippet', new Snippet())
    this.snippetmodel.ensureIndexes({ 'Module': 'hashed' })
  }
  /* Create snippet method, does input checking */
  create (title, content, author) {
    return new Promise(async (resolve, reject) => {
      if (title === '') {
        reject(new Error('Please enter a title'))
        return
      }
      if (content === '') {
        reject(new Error('Snippet cannot be blank'))
        return
      }
      if (title.length > 30) {
        reject(new Error('Snippet title can be max 30 characters'))
        return
      }
      // Using uuid to assign a unique id to each snippet that can be passed in the url query
      this.snippetmodel.create({ id: uuid(), title: title, content: content, author: author })
      resolve()
    })
  }
  /* Only gets the snippets that are owned by specified username */
  getOwnedSnippets (username) {
    return new Promise(async (resolve, reject) => {
      let ownedSnippets = await this.snippetmodel.find({ author: username })
      resolve(ownedSnippets)
    })
  }
  /* Checks if username is owner of snippet id */
  isOwner (username, id) {
    return new Promise(async (resolve, reject) => {
      let snippet = await this.snippetmodel.findOne({ id: id })
      if (snippet !== null) {
        if (snippet.author.toLowerCase() === username.toLowerCase()) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    })
  }
  /* Get all snippets except snippets where the author is username
  useful in rendering the snippet list */
  getAllSnippetsExcept (username) {
    return new Promise(async (resolve, reject) => {
      let allSnippets = await this.snippetmodel.find({ author: { $ne: username } })
      resolve(allSnippets)
    })
  }
  /* Returns the snippet of specific id */
  getSnippet (id) {
    return new Promise(async (resolve, reject) => {
      let snippet = await this.snippetmodel.find({ id: id })
      resolve(snippet)
    })
  }
  /* Edits the snippet of specific id, preforms error checking */
  editSnippet (id, title, content) {
    return new Promise(async (resolve, reject) => {
      if (await this.getSnippet(id).length === 0) {
        reject(new Error('Snippet not found'))
      }
      if (title === '') {
        reject(new Error('Please enter a title'))
        return
      }
      if (content === '') {
        reject(new Error('Snippet cannot be blank'))
        return
      }
      if (title.length > 30) {
        reject(new Error('Snippet title can be max 30 characters'))
        return
      }
      this.snippetmodel.updateMany({ 'id': id }, { $set: { 'title': title, 'content': content } }, function (err, res) {
        if (err) {
          console.log(err)
        }
      })
      resolve()
    })
  }
  /* Deletes the snippet of a specific id */
  deleteSnippet (id) {
    return new Promise(async (resolve, reject) => {
      if (await this.getSnippet(id).length === 0) {
        reject(Error)
      }
      this.snippetmodel.remove({ 'id': id }, function (err, res) {
        if (err) {
          console.log(err)
        }
      })
      resolve()
    })
  }
}
module.exports = SnippetController
