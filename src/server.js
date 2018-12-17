const express = require('express')
const session = require('express-session')
const fs = require('fs')
const https = require('https')
const bodyparser = require('body-parser')
const path = require('path')
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 8080
/* using express cookie parser with secret string */
app.use(cookieParser('C*+y<4-Yg@FvQrvKG@$z'))
/* Using express-session for flashing messages */
app.use(session({
  name: 'sticky-snippets',
  secret: 'C*+y<4-Yg@FvQrvKG@$z',
  saveUninitialized: false,
  resave: false,
  cookie: {
    domain: 'localhost',
    httpOnly: true,
    secure: true,
    maxAge: 2000 * 60 * 60 * 24
  }
}))
/* Setting up handlebars paths */
const handlebars = exphbs.create({
  defaultLayout: 'main',
  layoutsDir: path.resolve(__dirname, 'views/layouts'),
  partialsDir: path.resolve(__dirname, 'views/partials')
})
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
  extended: true
}))
/* Using public folder for all static resources */
app.use(express.static(path.resolve(__dirname, 'public')))
app.set('views', path.resolve(__dirname, 'views'))
app.engine('handlebars', handlebars.engine)
app.set('view engine', 'handlebars')

app.use('/', require(path.resolve(__dirname, 'controllers/controller.js')))
// Catches bad csrf tokens
/* app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
  res.send('Form temprered with')
}) */
/* Setting up HTTPS server using generated key and cert */
https.createServer({
  key: fs.readFileSync('./src/cert/server.key'),
  cert: fs.readFileSync('./src/cert/server.cert')
}, app)
  .listen(port)
console.log('https://localhost:' + port + '/')
