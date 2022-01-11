// Import modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const fs = require('fs');

// Import config
const config = require('./config.json');
const directory = require('./directory.json');

const app = express();
mongoose.connect(config.mongoURI);
const Editor = require('./schema/Editor.js')(mongoose);

// Add middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.get('*', (request, response, next) => {
  if (directory[request.path] !== undefined) {
    return response.render(directory[request.path], {
      parameters: request.query,
      config,
      //md,
      cookies: request.cookies,
    });
  }

  if (next) return next();
  return response.status(404).end();
});
app.use(express.static('static'));
app.set('view engine', 'pug');
app.set('views', './templates/');

// Routes
app.get('/submit/', async (request, response) => {
  response.render('submit', {
    config,
    parameters: request.query,
    cookies: request.cookies,
  });
});

app.get('/submit/guidelines/', async (request, response) => {
  response.render('guidelines', {
    config,
    parameters: request.query,
    content: '',
    cookies: request.cookies,
  });
});


// TODO: This should be a Router
app.get('/editors/', async (request, response) => {
  /*const editor = new Editor({
    auth: {
      username: "bhollon",
      password: "",
      email: "benjaminbhollon@gmail.com"
    }
  });
  editor.validate((err) => {
    if (err)
      console.error(err.errors[Object.keys(err.errors)[0]].properties);
    else
      console.log(editor);
  });*/

  console.log('hello?', 1);

  const editor = await Editor.findOne({
    username: request.cookies.username?.toLowerCase()
  });

  console.log('hello?', 2);

  if (editor !== null && request.cookies.token === editor.auth.token) {
    return response.redirect(302, '/editors/dashboard/');
  } else {
    const admin = await Editor.findOne({
      data: {
        roles: 'admin'
      }
    });

    if (admin === null) {
      return response.redirect('/editors/setup/');
    }
  }

  console.log('hello?', 3);

  return response.json({success: false});
});

app.get('/editors/dashboard/', async (request, response) => {
  const editor = await Editor.findOne({
    username: request.cookies.username?.toLowerCase()
  });
  if (!editor || request.cookies.token !== editor.auth.token) {
    return response.redirect('/editors/');
  }

  response.render('editors/dashboard', {
    config,
    editor,
    cookies: request.cookies,
    parameters: request.query
  });
});

app.get('/editors/setup/', async (request, response) => {
  response.render('editors/setup', {
    config,
    cookies: request.cookies,
    parameters: request.query
  });
});

app.post('/editors/setup/', async (request, response) => {
  if (request.body.password !== request.body.passwordConfirm) {
    return response.render('editors/setup', {
      config,
      cookies: request.cookies,
      parameters: request.query
    });
  }

  const editor = new Editor({
    auth: {
      username: request.body.username,
      email: request.body.email,
      password: request.body.password
    },
    data: {
      profile: {
        name: request.body.name
      },
      roles: [
        'admin'
      ]
    }
  });

  await editor.save();

  config.magazine.title = request.body.title;

  fs.writeFileSync('./config.json', JSON.stringify(config));

  response.cookie('username', editor.auth.username);
  response.cookie('token', editor.auth.token);

  console.log('hello?');

  response.redirect(302, '/editors/dashboard/');
});

// Listen on port in config.json
app.listen(config.port, async () => {
  console.info('Serving awesomeness on port ' + config.port);
});
