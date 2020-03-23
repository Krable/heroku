const axios = require('axios')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const express = require('express')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const PORT = process.env.PORT
const secret = 'thisismysecret'
const urlEncodedParser = bodyParser.urlencoded({ extended: true })
const cors = require('cors')

const app = express()
app.use(bodyParser.json())
app.use(cors())

const users = [{ email: 'pcavalet@kaliop.com', password: 'kaliop' }]

const configuration = {
  'cache-control': 'no-cache',
  'x-apikey': '4ee56fd28c586c7ce5e76b325264f34283e6a',
  'content-type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: secret,
}

const jwtStrategy = new JwtStrategy(jwtOptions, function(payload, next) {
  console.log('jwtStrategy ' + payload.email)
  console.log('jwtStrategy ' + payload.password)
  console.log('jwtStrategy ' + payload.id)
  const email = payload.email
  const password = payload.password
  const identifiant = payload.id

  if (email && password && identifiant) {
    getUserByEmail(email)
      .then(response => {
        const user = response

        if (user) {
          next(null, user)
        } else {
          next(null, false)
        }
      })
      .catch(console.log)
  } else {
    next(null, false)
  }
})

passport.use(jwtStrategy)

app.get('/public', (req, res) => {
  const email = 'lemoinelucas1@gmail.com'
  const password =
    '$2b$10$ZjhrLrqNrvBD2O7SyGmZ.OHV.EC4H2TvL.DDPqBosdrQS1fSf6Yhe'
  getUserByEmail(email).then(data => {
    res.json({ message: 'Request received!', data })
  })
  //res.send("I am public folks!");
})

app.get(
  '/private',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.send('Hello ' + req.user.emailUser)
  },
)

app.post('/login', (req, res) => {
  const email = req.body.email
  const password = req.body.password
  console.log('tentative de connexion')

  if (!email || !password) {
    console.log('pas de mail ou mdp')
    res.status(401).json({ error: 'Email or password was not provided.' })
    return
  }

  getUserByEmail(email)
    .then(function(response) {
      let user = response

      if (!user) {
        console.log('erreur mdp ou email')
        res.status(401).json({ error: 'Email / password do not match.' })
        return
      }

      let comparePassword = comparerCrypt(password, user.passwordUser)

      if (!comparePassword) {
        console.log('erreur mdp ou email')
        res.status(401).json({ error: 'Email / password do not match.' })
        return
      }

      console.log('/login ' + comparePassword)

      if (!user) {
        console.log('erreur mdp ou email')
        res.status(401).json({ error: 'Email / password do not match.' })
        return
      }
      console.log("Signature de l'email" + user.emailUser)

      const userJwt = jwt.sign(
        { id: user._id, email: user.emailUser, password: user.passwordUser },
        secret,
      )

      console.log(userJwt)

      res.json({ user, userJwt })
    })
    .catch(console.log)
})

function crypter(text) {
  let encrypter = bcrypt.hashSync(text, 10)
  return encrypter
}
function comparerCrypt(pwd, hash) {
  return bcrypt.compareSync(pwd, hash)
}

function getUserByEmail(email) {
  console.log(email)

  return axios
    .get(
      'https://dephero-b04e.restdb.io/rest/utilisateur?q={"emailUser":"' +
        email +
        '"}',
      { headers: configuration },
    )
    .then(response => {
      return response.data[0]
    })
    .catch(console.log)
}

app.post('/getUser', function(req, res) {
  console.log(req.body.email + ' et ' + req.body.pwd)
  axios
    .get(
      'https://dephero-b04e.restdb.io/rest/utilisateur?q={"emailUser":"' +
        req.body.email +
        '","passwordUser":"' +
        crypter(req.body.pwd) +
        '"}',
      { headers: configuration },
    )
    .then(response => res.send(response.data))
    .catch(console.log)
})

//Testé et Approuvé
app.post('/addUser', function(req, res) {
  let password = req.body.password
  let pwHasher = crypter(password)
  console.log(req.body)

  axios({
    method: 'POST',
    url: 'https://dephero-b04e.restdb.io/rest/utilisateur',
    headers: configuration,
    data: {
      nomUser: req.body.nom,
      prenomUser: req.body.prenom,
      emailUser: req.body.email,
      passwordUser: pwHasher,
    },
    responseType: 'json',
  })
    .then(response => {
      res.send(response.data)
    })
    .catch(error => {
      res.send(error)
    })
})

//Testé et Approuvé
app.get('/getAllArticles', function(req, res) {
  axios
    .get('https://dephero-b04e.restdb.io/rest/articles', {
      headers: configuration,
    })
    .then(response => res.send(response.data))
    .catch(console.log)
})

app.get(
  '/getAllArticlesByUser',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const email = req.user.emailUser
    console.log('getAllArticlesByUser ' + email)
    axios
      .get(
        'https://dephero-b04e.restdb.io/rest/articles?q={"auteur":{"emailUser": "' +
          email +
          '"}}',
        {
          headers: configuration,
        },
      )
      .then(response => res.send(response.data))
      .catch(console.log)
  },
)

//Testé et Approuvé
app.get('/getArticleById/:idarticle', function(req, res) {
  axios
    .get(
      'https://dephero-b04e.restdb.io/rest/articles/' + req.params.idarticle,
      { headers: configuration },
    )
    .then(response => res.send(response.data))
    .catch(console.log)
})

//Testé et Approuvé
app.post(
  '/addArticle',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    console.log('tentative add article')

    axios({
      method: 'POST',
      url: 'https://dephero-b04e.restdb.io/rest/articles',
      headers: configuration,
      data: {
        titre: req.body.titre,
        contenu: req.body.contenu,
        auteur: req.user._id, //test
      },
      responseType: 'json',
    })
      .then(response => {
        res.send(response.data)
      })
      .catch(error => {
        res.send(error)
      })
  },
)

//Testé et Approuvé
app.post(
  '/editArticle',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'PUT',
      url:
        'https://dephero-b04e.restdb.io/rest/articles/' + req.body.identifiant,
      headers: configuration,
      data: {
        titre: req.body.titre, //test
        contenu: req.body.contenu, //test
        auteur: req.user._id, //test
      },
      responseType: 'json',
    })
      .then(response => {
        res.send(response.data)
      })
      .catch(error => {
        res.send(error)
      })
  },
)

//Testé et Approuvé
app.get(
  '/dropArticle/:idarticle',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    axios({
      method: 'DELETE',
      url:
        'https://dephero-b04e.restdb.io/rest/articles/' + req.params.idarticle,
      headers: configuration,
    })
      .then(response => {
        res.send(response.data)
      })
      .catch(error => {
        res.send(error)
      })
  },
)

app.listen(PORT, () => {
  console.log('app running on port 5000')
})
