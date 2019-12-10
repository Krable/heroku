const express = require('express')
const app = express()
const PORT = process.env.PORT || 5000 // this is very important
const request = require("request");

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT)
})



var options = { method: 'GET',
  url: 'https://dephero-b04e.restdb.io/rest/users',
  headers: 
   { 'cache-control': 'no-cache',
     'x-apikey': '4ee56fd28c586c7ce5e76b325264f34283e6a' } };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});