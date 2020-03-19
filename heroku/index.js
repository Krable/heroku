const axios = require("axios")
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const express = require('express')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const PORT = process.env.PORT || 5000
const secret = 'thisismysecret'
const urlEncodedParser = bodyParser.urlencoded({ extended: true })

const app = express()
app.use(bodyParser.json());

const users = [{ email: 'pcavalet@kaliop.com', password: 'kaliop' }]

const configuration = {
        'cache-control': 'no-cache',
        'x-apikey': '4ee56fd28c586c7ce5e76b325264f34283e6a',
        'content-type': 'application/json',
        'ObjectID' : '5df8db1291eb7c5a0001196b' 
}

const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
}

const jwtStrategy = new JwtStrategy(jwtOptions, function(payload, next) {
  
  const user = users.find(user => user.email === payload.user)

  if (user) {
    next(null, user)
  } else {
    next(null, false)
  }
})

passport.use(jwtStrategy)

app.get('/public', (req, res) => {
  res.send('I am public folks!')
})

app.get('/private', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.send('Hello ' + req.user.email)
})

app.post('/login', (req, res) => {
  const email = req.body.email
  const password = req.body.password
  console.log(req.body);

  if (!email || !password) {
    console.log("pas de mail ou mdp")
    res.status(401).json({ error: 'Email or password was not provided.' })
    return
  }

  // usually this would be a database call:
  const user = users.find(user => user.email === email)

  if (!user || user.password !== password) {
    console.log("erreur mdp ou email")
    res.status(401).json({ error: 'Email / password do not match.' })
    return
  }

  const userJwt = jwt.sign({ user: user.email }, secret)

  res.json({user, userJwt })
})

function crypter(text){
  const hash = bcrypt.hashSync(text, 10);
  return hash
}
function comparerCrypt(pwd, hash){
  let bool = bcrypt.compareSync(pwd, hash);
  return bool
}


app.post("/addUser",urlEncodedParser, function (req, res) {

    let password = req.body.password
    let pwHasher = crypter(password)
    console.log(req.body)
    

    axios({
        "method": "POST",
        "url": "https://dephero-b04e.restdb.io/rest/utilisateur",
        "headers": configuration,
        "data": { 
            "nomUser": req.body.nom,
            "prenomUser": req.body.prenom,
            "emailUser": req.body.email,
            "passwordUser": pwHasher
        },
          "responseType": 'json'
    }).then(response => {
        res.send(response.data);
    }).catch(error => {
        res.send(error);
    })
})

//Testé et Approuvé
app.get('/getAllArticles', function (req, res) {
    axios.get('https://dephero-b04e.restdb.io/rest/articles', { headers: configuration } )
      .then(response => (res.send(response.data))).catch(console.log)
})

//Testé et Approuvé
app.get('/getArticleById/:idarticle', function (req, res) {
    axios.get('https://dephero-b04e.restdb.io/rest/articles/'+req.params.idarticle, { headers: configuration } )
      .then(response => (res.send(response.data))).catch(console.log)
})

//Testé et Approuvé
app.post("/addArticle",urlEncodedParser, function (req, res) {
    axios({
        "method": "POST",
        "url": "https://dephero-b04e.restdb.io/rest/articles",
        "headers": configuration,
        "data": { 
            "titre": req.body.titre,
            "contenu": req.body.contenu,
            "auteur": '5df8db1291eb7c5a0001196b' //test
        },
          "responseType": 'json'
    }).then(response => {
        res.send(response.data);
    }).catch(error => {
        res.send(error);
    })
})

//Testé et Approuvé
app.post("/editArticle",urlEncodedParser, function (req, res) {
    //check jwt;
    //récupérer id auteur
    //comparer id Auteur avec celui du JWT
    axios({
        "method": "PUT",
        "url": "https://dephero-b04e.restdb.io/rest/articles/"+req.body.identifiant,
        "headers": configuration,
        "data": { 
            "titre": req.body.titre, //test
            "contenu": req.body.contenu, //test
            "auteur": 'holla' //test
        },
          "responseType": 'json'
    }).then(response => {
        res.send(response.data);
    }).catch(error => {
        res.send(error);
    })
})

//Testé et Approuvé
app.get("/dropArticle/:idarticle", function (req, res) {
    axios({
        "method": "DELETE",
        "url": "https://dephero-b04e.restdb.io/rest/articles/"+req.params.idarticle,
        "headers": configuration
    }).then(response => {
        res.send(response.data);
    }).catch(error => {
        res.send(error);
    })
})

//Partie Controller

app.get("/createArticle", function (req, res) {
    res.sendFile(__dirname+"/ressources/formArticle.html");
})

app.get("/updateArticle", function (req, res) {
    res.sendFile(__dirname+"/ressources/formUpdateArticle.html", {name:"azerty123"});
})

app.get("/createUser", function (req, res) {
    res.sendFile(__dirname+"/ressources/formCreateAccount.html");
})

app.listen(PORT, () => {
  console.log('app running on port 5000')
})
