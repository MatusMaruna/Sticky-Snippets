const User = require('../models/user.js')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
/* Controller for users, preforms registration and login */
class UserController {
  constructor () {
    this.usermodel = mongoose.model('user', new User())
  }
  /* Sign up method preforms input checking and inserts the new user
  record in the mongodb */
  async signUp (username, password) {
    return new Promise(async (resolve, reject) => {
      var userRegex = /^[a-zA-Z0-9]/
      username = username.toLowerCase()
      if (!(username.length >= 3) || !(username.length <= 10)) {
        reject(new Error('Username needs to be between 3-10 characters'))
        return
      }
      if (!(password.length >= 4) || !(password.length <= 100)) {
        reject(new Error('Password needs to be between 4-100 characters'))
        return
      }
      if (!username.match(userRegex)) {
        reject(new Error('Username may only contain A-Z 0-9'))
        return
      }
      if (await this.usermodel.findOne({ username: username })) {
        reject(new Error('Username is taken!'))
        return
      }
      /* Use bcrypt to hash the password */
      this.hash = bcrypt.hash(password, 10).then(function (hash) {
        return hash
      })

      await this.usermodel.create({ username: username, password: await this.hash })
      resolve()
    })
  }
  /* compare input to saved hash reject on username not found
  or password not matching */
  async logIn (username, password) {
    return new Promise(async (resolve, reject) => {
      username = username.toLowerCase()
      this.usermodel.findOne({ username: username }, async function (err, data) {
        if (err || data === null) {
          reject(new Error('Wrong username/password'))
        } else {
          if (await bcrypt.compare(password, data.password)) {
            resolve()
          } else {
            reject(new Error('Wrong username/password'))
          }
        }
      }).catch(function (Error) {
        reject(Error.message)
      })
    })
  }
}
module.exports = UserController
