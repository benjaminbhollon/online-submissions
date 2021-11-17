const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const uniqueValidator = require('mongoose-unique-validator');

function hash(value) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(value, salt);
}

module.exports = (mongoose) => {
  const schema = new mongoose.Schema({
    auth: {
      token: {
        type: String,
        default: () => uuidv4()
      },
      email: {
        type: String,
        lowercase: true,
        required: [true, "Include an email!"],
        match: [/\S+@\S+\.\S+/, 'That email is invalid!'],
        index: true
      },
      password: {
        type: String,
        required: [true, "Include a password!"],
        //minLength: [12, 'For better security, your password should be at least 12 characters. Try lengthening it.'],
        //maxLength: [128, 'Long passwords are great, but going over 256 characters is a bit overkill and could cause performance issues. Try shortening that.'],
        set: v => hash(v)
      },
      username: {
        type: String,
        lowercase: true,
        unique: true,
        required: [true, "Include a username!"],
        match: [/^[a-zA-Z0-9]+$/, 'That username is invalid!'],
        minLength: [3, 'That username is too short! Make it at least 3 characters.'],
        maxLength: [32, 'That username is too long! Don\'t go over 32 characters.'],
        index: true
      }
    },
    data: {
      profile: {
        name: {
          type: String,
          default: '',
          maxLength: [32, 'That name is too long!']
        },
        bio: {
          type: String,
          maxLength: [2048, 'You really don\'t need a bio with more than 2048 characters. Try shortening that.'],
          default: ''
        }
      },
      roles: {
        type: [{
          type: String
        }],
        default: ['editor']
      },
      tasks: [{
        title: String,
        type: String,
        summary: String,
        ref: mongoose.ObjectId
      }]
    }
  });

  schema.plugin(uniqueValidator, {message: 'Your username is already taken.'});

  return mongoose.model('Editor', schema);
};
