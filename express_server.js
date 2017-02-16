const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 8080; // default port 8080

const urlDatabase = {
  'userRandomID': {
    'b2xVn2': 'http://www.lighthouselabs.ca',
    '9sm5xK': 'http://www.google.com'
  },
  'user2RandomID': {
    iAn82x: 'http://www.facebook.com',
    n23bIb: 'http://www.youtube.com'
  }
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
 'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  console.log(users);
  console.log('________________________________________________________________________');
  let urlDatabaseCurrent = urlDatabase;
  if (req.cookies['user_id']) {
    urlDatabaseCurrent = urlDatabase[req.cookies['user_id']];
    res.render('urls_index', { user_current: users[req.cookies['user_id']], urls: urlDatabaseCurrent });
  } else {
    res.render('urls_index_login', { user_current: users[req.cookies['user_id']] });
  }
});

app.get('/urls/new', (req, res) => {
  if (req.cookies['user_id']) {
    res.render('urls_new', { user_current: users[req.cookies['user_id']] });
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  res.render('urls_register', { user_current: users[req.cookies['user_id']] })
});

app.get('/login', (req, res) => {
  res.render('urls_login', { user_current: users[req.cookies['user_id']] })
});

app.get('/urls/:id', (req, res) => {
  if (req.cookies['user_id']){
    if (req.params.id in urlDatabase[req.cookies['user_id']]){
      res.render('urls_show', { user_current: users[req.cookies['user_id']], shortURL: req.params.id, longURL: urlDatabase[req.cookies['user_id']][req.params.id] });
      return;
    }
  }
  res.redirect('/');
});

app.get('/u/:shortURL', (req, res) => {
  let creator;
  for (let id in urlDatabase) {
    for (let url in urlDatabase[id]) {
      if (req.params.shortURL === url) {
        creator = id;
      }
    }
  }
  res.redirect(urlDatabase[creator][req.params.shortURL]);
});

app.post('/urls', (req, res) => {
  if (req.body.longURL) {
    let shortURL = generateRandomString();
    urlDatabase[req.cookies['user_id']][shortURL] = req.body.longURL;
  }
  res.redirect('/urls');
});

app.post('/urls/:id/edit', (req, res) => {
  urlDatabase[req.cookies['user_id']][req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  if (req.cookies['user_id']) {
    if (req.params.id in urlDatabase[req.cookies['user_id']]) {
      delete urlDatabase[req.cookies['user_id']][req.params.id];
    }
  }
  res.redirect('/');
});

app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Please enter an email and a password.');
  return;
  }
  for (let user in users) {
    if (req.body.email !== users[user].email) {
      continue;
    } else if (req.body.password === users[user].password) {
        res.cookie('user_id', user);
        res.redirect('/');
        return;
    } else {
      res.status(403).send('Password does not match.');
      return;
    }
  }
  res.status(403).send('Email does not exist.');
  return;
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('urls/');
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Please enter an email and a password.');
    return;
  }
  for (let user in users) {
    if (req.body.email === users[user].email) {
      res.status(400).send(`Email ${req.body.email} already exists.`);
      return;
    }
  }
  let userID = generateRandomString();
  users[userID] = { id: userID, email: req.body.email, password: req.body.password };
  res.cookie('user_id', userID);
  res.redirect('/');
});

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
