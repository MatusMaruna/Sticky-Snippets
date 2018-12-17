const mongoose = require('mongoose')

class DBController {
  constructor () {
    mongoose.Promise = global.Promise
    this.uri = ''
  }
  /* Connects mongoose to mongodb database */
  connect () {
    return new Promise((resolve, reject) => {
      mongoose.connect(this.uri, {
        useMongoClient: true
      })
        .then(() => resolve())
        .catch(() => reject(new Error('Couldnt connect to database!')))
    })
  }
}
module.exports = DBController
