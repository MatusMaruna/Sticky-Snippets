const mongoose = require('mongoose')

class Snippet extends mongoose.Schema {
  constructor () {
    super({
      id: {
        type: String,
        required: true,
        unique: true
      },
      title: {
        type: String,
        required: true,
        maxlength: 30
      },
      content: {
        type: String,
        unique: false,
        minlength: 1,
        required: true
      },
      author: {
        type: String,
        unique: false,
        required: true
      }
    })
  }
}
module.exports = Snippet
