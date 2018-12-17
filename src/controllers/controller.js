
const express = require('express')
var router = express.Router()
const UserController = require('./user-controller')
const DBController = require('./db-controller')
const SnippetController = require('./snippet-controller')
const jwt = require('jsonwebtoken')

/* Class which handles the rendering of views and calling other controller methods
  when required  */
class Controller {
  constructor () {
    var dbCont = new DBController()
    dbCont.connect()
    var userCont = new UserController()
    var snippetCont = new SnippetController()
    /* Landing page, login */
    router.get('/', function (req, res) {
      // redirect the user to snippetspace if logged in
      if (req.signedCookies.logInToken) {
        res.redirect(301, '/snippetspace')
      } else {
        res.render('login', { title: 'Sticky-Snippets Login' })
      }
    })
    /* Same as landing page checks if user is logged in already */
    router.get('/login', function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          res.send('You must logout first to login')
        }
      } else {
        res.render('login', { title: 'Sticky-Snippets Login' })
      }
    })
    /* /login POST calls user controller and verifies credentials then assigns
      the user a cookie 'logInToken' signed by jsonwebtoken with payload as the
      username and a secret
    */
    router.post('/login', function (req, res) {
      userCont.logIn(req.body.username, req.body.password).then(function () {
        var token = jwt.sign({ username: req.body.username.toLowerCase() }, '.3_FK"Y-L<WepGkq^cG"', { expiresIn: 2000 * 60 * 60 * 24 })
        res.cookie('logInToken', token, { maxAge: 2000 * 60 * 60 * 24, httpOnly: true, secure: true, signed: true })
        res.redirect(301, '/snippetspace')
      }).catch(function (err) {
        // If failed flash an error passed by the user controller. Eg. Wrong Username/Password
        req.session.flash = req.session.flash = { type: 'fail', message: err.message }
        res.redirect(301, '/')
      })
    })
    /* Same as /login checks if the user is already logged in */
    router.get('/register', function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          res.send('You must logout first to register')
        }
      } else {
        res.render('login', { title: 'Sticky-Snippets Login' })
      }
    })
    /* /register POST calls user controller and verifies the input, if valid it will be inserted
    into db and user will be logged in, otherwise flash error message */
    router.post('/register', function (req, res) {
      userCont.signUp(req.body.username, req.body.password).then(function () {
        var token = jwt.sign({ username: req.body.username.toLowerCase() }, '.3_FK"Y-L<WepGkq^cG"', { expiresIn: 2000 * 60 * 60 * 24 })
        res.cookie('logInToken', token, { maxAge: 2000 * 60 * 60 * 24, httpOnly: true, secure: true, signed: true })
        res.redirect(301, '/snippetspace')
      }).catch(function (err) {
        req.session.flash = req.session.flash = { type: 'fail', message: err.message }
        res.redirect(301, '/')
      })
    })
    /* Logout method, clear users logInToken cookie and redirect to landing page */
    router.get('/logout', function (req, res) {
      res.clearCookie('logInToken')
      req.session.flash = { type: 'success', message: 'Logged out successfully!' }
      res.redirect(301, '/')
    })
    /* Main 'workspace', verify if user is logged in, if so get all snippets (
      owned snippets are rendered differently). If user is not logged in then
      render 'guest' mode which view */
    router.get('/snippetspace', async function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          let user = jwt.decode(req.signedCookies.logInToken).username.toLowerCase()
          let ownedSnippets = await snippetCont.getOwnedSnippets(user)
          let allSnippets = await snippetCont.getAllSnippetsExcept(user)
          res.render('snippetspace', { title: 'Snippet Space', ownedsnippet: ownedSnippets, snippet: allSnippets})
        } else {
          // If user has a invalid logInToken it is cleared
          res.clearCookie('logInToken')
          res.redirect(301, '/')
        }
      } else {
        let allSnippets = await snippetCont.getAllSnippetsExcept('')
        res.render('snippetspace', { title: 'Snippet Space Guest', guest: true, snippet: allSnippets })
      }
    })
    /* Check that the user is signed in, render the main 'workspace' snippetspace but showing
    the editor instead of snippet list */
    router.get('/snippetspace/create', function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          res.render('snippetspace', {title: 'Snippet Create ', create: true})
        } else {
          res.clearCookie('logInToken')
          res.redirect(301, '/')
        }
      } else {
        res.redirect(403, '/')
      }
    })
    /* POST method for creating a snippet, decodes the username from logInToken cookie to
    assign the snippet to the user */
    router.post('/snippetspace/create/submit', async function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          let user = jwt.decode(req.signedCookies.logInToken).username.toLowerCase()
          snippetCont.create(req.body.title, req.body.save, user).then(function () {
            // Flash success or fail message to keep user informed
            req.session.flash = { type: 'success', message: 'Snippet created successfully!' }
            res.redirect(301, '/snippetspace/')
          }).catch(function (err) {
            req.session.flash = { type: 'fail', message: err.message }
            res.redirect(301, '/snippetspace/create/')
          })
        } else {
          res.clearCookie('logInToken')
          res.redirect(301, '/')
        }
      } else {
        res.redirect(403, '/')
      }
    })
    /* Snippet view method, each snippet has a unique id which is passed in the
      url query. Checks if the user is the owner of the snippet, if so editing
      buttons will be visible and functional */
    router.get('/snippetspace/view', async function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          // Get username from jwt payload in logInToken
          let user = jwt.decode(req.signedCookies.logInToken).username.toLowerCase()
          let snippet = await snippetCont.getSnippet(req.query.id)
          // Check if snippet exists
          if (snippet.length === 0) {
            res.redirect(500, '/snippetspace/')
          }
          // Check if user is the owner
          if (await snippetCont.isOwner(user, req.query.id)) {
            res.render('snippetspace', { title: 'Snippet view', create: true, edit: true, savecontent: snippet[0].content, savetitle: snippet[0].title })
          } else {
            res.render('snippetspace', { title: 'Snippet view', create: true, edit: true, view: true, savecontent: snippet[0].content, savetitle: snippet[0].title })
          }
        } else {
          res.clearCookie('logInToken')
          res.redirect(301, '/')
        }
      } else {
        // If users are not logged in they will get guest view
        let snippet = await snippetCont.getSnippet(req.query.id)
        res.render('snippetspace', { title: 'Snippet view guest', create: true, edit: true, guest: true, savecontent: snippet[0].content, savetitle: snippet[0].title })
      }
    })
    /* edit POST method. Checks that the user is the owner, if so it will verify
    the input and update the snippet, lastly the user is informed through a flash
    message */
    router.post('/snippetspace/edit', function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          let id = req.headers.referer.split('?id=')[1] || ''
          let user = jwt.decode(req.signedCookies.logInToken).username.toLowerCase()
          if (snippetCont.isOwner(user, id)) {
            snippetCont.editSnippet(id, req.body.title, req.body.save).then(function () {
              // Flash success or fail message to keep user informed
              req.session.flash = { type: 'success', message: 'Snippet edited successfully!' }
              res.redirect(301, '/snippetspace/')
            }).catch(function (err) {
              req.session.flash = { type: 'fail', message: err.message }
              res.redirect(301, '/snippetspace/view/?id=' + id)
            })
          } else {
            req.session.flash = { type: 'fail', message: 'You cant edit a snippet you dont own!' }
            res.redirect(403, '/snippetspace/')
          }
        } else {
          res.clearCookie('logInToken')
          res.redirect(301, '/')
        }
      } else {
        res.redirect(403, '/')
      }
    })
    /* snippet delete POST method, checks that the user is the owner, if so the snippet is
    deleted and the user is informed through a flash */
    router.post('/snippetspace/delete', function (req, res) {
      if (req.signedCookies.logInToken) {
        if (jwt.verify(req.signedCookies.logInToken, '.3_FK"Y-L<WepGkq^cG"')) {
          let id = req.headers.referer.split('?id=')[1] || ''
          let user = jwt.decode(req.signedCookies.logInToken).username.toLowerCase()
          if (snippetCont.isOwner(user, id)) {
            snippetCont.deleteSnippet(id)
            req.session.flash = { type: 'success', message: 'Snippet deleted successfully!' }
            res.redirect(301, '/snippetspace/')
          } else {
            req.session.flash = { type: 'fail', message: 'You cant delete a snippet you dont own!' }
            res.redirect(301, '/snippetspace/')
          }
        } else {
          res.clearCookie('logInToken')
          res.redirect(301, '/')
        }
      } else {
        res.redirect(403, '/')
      }
    })
  }
}

module.exports = new Controller()
module.exports = router
