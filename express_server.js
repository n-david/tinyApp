const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 8080; // default port 8080

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  res.render('urls_index', { username: req.cookies['username'], urls: urlDatabase });
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new', { username: req.cookies['username'] });
});

app.get('/urls/:id', (req, res) => {
  res.render('urls_show', { username: req.cookies['username'], shortURL: req.params.id, longURL: urlDatabase[req.params.id] });
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:id/edit', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  console.log(req.body);
  res.cookie('username', req.body.username);
  res.redirect('urls/');
});

app.post('/logout', (req, res) => {
  console.log(req.body);
  res.clearCookie('username');
  res.redirect('urls/');
})

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

function generateRandomString() {
  let randomString = '';
  let alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let chars = 0;
  while (chars < 6) {
    randomString += alphabet[Math.floor(Math.random() * alphabet.length)];
    chars++;
  }
  return randomString;
}
