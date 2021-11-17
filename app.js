// Import modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

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
app.get('/submit/guidelines/', async (request, response) => {
  response.render('submissionGuidelines', {
    config,
    parameters: request.query,
    content: ''
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

  const editor = await Editor.findOne({
    username: request.cookies.username?.toLowerCase()
  });

  if (editor !== null) {
    response.redirect(302, '/editors/dashboard');
  } else {
    const admin = await Editor.findOne({
      data: {
        roles: 'admin'
      }
    });

    if (admin === null) {
      response.redirect('/editors/setup/');
    }
  }

  response.json({success: false});
});

app.get('/editors/dashboard/', async (request, response) => {
  const editor = await Editor.findOne({
    username: request.cookies.username?.toLowerCase()
  });
  if (!editor) {
    return response.redirect('/editors/');
  }

  response.render('editors/dashboard', {
    config,
    parameters: request.query
  });
});

app.get('/editors/setup/', async (request, response) => {
  response.render('editors/setup', {
    config,
    parameters: request.query
  });
});

// Listen on port in config.json
app.listen(config.port, async () => {
  console.info('Serving awesomeness on port ' + config.port);
});
