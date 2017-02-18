const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const app = express();
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'development'],
  maxAge: 24 * 60 * 60 * 1000
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 8080; // default port 8080

const urlDatabase = {
  'userRandomID': {
    'b2xVn2': 'http://www.lighthouselabs.ca',
    '9sm5xK': 'http://www.google.com'
  },
  'user2RandomID': {
    'iAn82x': 'http://www.facebook.com',
    'n23bIb': 'http://www.youtube.com'
  }
};

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('purple-monkey-dinosaur', 10)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
  }
};

const counters = {
  'b2xVn2': [0, 0],
  '9sm5xK': [0, 0],
  'iAn82x': [0, 0],
  'n23bIb': [0, 0]
};

const visitorDatabase = {};

const datesID = {};

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

app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  let urlDatabaseCurrent = urlDatabase;
  if (req.session.user_id) {
    urlDatabaseCurrent = urlDatabase[req.session.user_id];
    res.render('urls_index', { userCurrent: users[req.session.user_id], urls: urlDatabaseCurrent });
  } else {
    res.status(401).render('urls_unauthorized', { userCurrent: users[req.session.user_id] });
  }
});

app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    res.render('urls_new', { userCurrent: users[req.session.user_id] });
  } else {
    res.status(401).render('urls_unauthorized', { userCurrent: users[req.session.user_id] });
  }
});

app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/');
    return;
  }
  res.render('urls_register', { userCurrent: users[req.session.user_id] });
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/');
    return;
  }
  res.render('urls_login', { userCurrent: users[req.session.user_id] });
});

app.get('/urls/:id', (req, res) => {
  for (let id in urlDatabase) {
    if (!(req.params.id in urlDatabase[id])) {
      continue;
    } else if (req.session.user_id) {
      if (req.params.id in urlDatabase[req.session.user_id]) {
        res.render('urls_show', { userCurrent: users[req.session.user_id], shortURL: req.params.id, longURL: urlDatabase[req.session.user_id][req.params.id], visits: counters[req.params.id][0], uniqueVisits: counters[req.params.id][1], dates: datesID[req.params.id] });
        return;
      }
      res.status(403).send('URL created by another user. Unauthorized to access.');
      return;
    }
    res.status(401).render('urls_unauthorized', { userCurrent: users[req.session.user_id] });
    return;
  }
  res.status(404).send('URL entered is not in database.');
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
  if (!creator) {
    res.status(404).send('URL not found. Redirect unsuccessful.');
    return;
  }
  counters[req.params.shortURL][0]++;
  if (!(datesID[req.params.shortURL])) {
    datesID[req.params.shortURL] = { dates: [new Date()], ids: [generateRandomString()] };
    // [new Date(), generateRandomString];
  } else {
    datesID[req.params.shortURL]['dates'].push(new Date());
    datesID[req.params.shortURL]['ids'].push(generateRandomString());
  }
  if (!req.session.visitor) {
    let visitor_id = generateRandomString();
    req.session.visitor = visitor_id;
    if (visitorDatabase[req.params.shortURL] === undefined) {
      visitorDatabase[req.params.shortURL] = [visitor_id];
      counters[req.params.shortURL][1] += 1;
    }
  } else if (!(visitorDatabase[req.params.shortURL])) {
    visitorDatabase[req.params.shortURL] = [req.session.visitor];
    counters[req.params.shortURL][1] += 1;
  } if (!(visitorDatabase[req.params.shortURL].includes(req.session.visitor))) {
    visitorDatabase[req.params.shortURL].push(req.session.visitor);
    counters[req.params.shortURL][1] += 1;
  }
  res.redirect(urlDatabase[creator][req.params.shortURL]);
});

app.post('/urls', (req, res) => {
  if (req.session.user_id) {
    let shortURL = generateRandomString();
    if (req.body.longURL) {
      if (!urlDatabase[req.session.user_id]) {
        urlDatabase[req.session.user_id] = {};
      }
      urlDatabase[req.session.user_id][shortURL] = req.body.longURL;
      counters[shortURL] = [0, 0];
    }
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).render('urls_unauthorized', { userCurrent: users[req.session.user_id] });
  }
});

app.put('/urls/:id', (req, res) => {
  for (let id in urlDatabase) {
    if (!(req.params.id in urlDatabase[id])) {
      continue;
    } else if (req.session.user_id) {
      if (req.params.id in urlDatabase[req.session.user_id]) {
        urlDatabase[req.session.user_id][req.params.id] = req.body.longURL;
        res.redirect(`/urls/${req.params.id}`);
        return;
      }
      res.status(403).send('URL created by another user. Unauthorized to access.');
      return;
    }
    res.status(401).render('urls_unauthorized', { userCurrent: users[req.session.user_id] });
    return;
  }
  res.status(404).send('URL entered is not in database.');
});

app.delete('/urls/:id', (req, res) => {
  for (let id in urlDatabase) {
    if (!(req.params.id in urlDatabase[id])) {
      continue;
    } else if (req.session.user_id) {
      if (req.params.id in urlDatabase[req.session.user_id]) {
        delete urlDatabase[req.session.user_id][req.params.id];
        res.redirect('/');
        return;
      }
      res.status(403).send('URL created by another user. Unauthorized to access.');
      return;
    }
    res.status(401).render('urls_unauthorized', { userCurrent: users[req.session.user_id] });
    return;
  }
  res.status(404).send('URL entered is not in database.');
});

app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Please enter an email and a password.');
    return;
  }
  for (let user in users) {
    if (req.body.email !== users[user].email) {
      continue;
    } else if (bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = user;
      res.redirect('/');
      return;
    }
    res.status(401).send('Password does not match.');
    return;
  }
  res.status(403).send('Email does not exist.');
  return;
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
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
  users[userID] = { id: userID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10) };
  req.session.user_id = userID;
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
