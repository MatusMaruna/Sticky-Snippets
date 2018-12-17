const mongoose = require('mongoose')

class User extends mongoose.Schema {
  constructor () {
    super({
      username: {
        type: String,
        required: true,
        minlength: 3,
        unique: true
      },
      password: {
        type: String,
        unique: false,
        minlength: 4,
        required: true
      }
    })
  }
}
module.exports = User
