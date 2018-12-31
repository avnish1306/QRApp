// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    userId: {
        type: String,
        unique: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isHero: {
        type: Boolean,
        default: false
    },

    idStatus: {
        type: Boolean,
        default: false
    },
    profilePic: {
        type: String,
        default: ".../public/images/dummy.png"
    },
    local: {
        email: String,
        password: String
    },
    facebook: {
        id: String,
        token: String,
        name: String,
        email: String
    },
    twitter: {
        id: String,
        token: String,
        displayName: String,
        username: String
    },
    google: {
        id: String,
        token: String,
        email: String,
        name: String
    },
    qrcode: {
        type: String
    },
    name: {
        type: String,
        default: "none"
    },
    college: {
        type: String,
        default: " "
    },
    city: {
        type: String,
        default: ""
    },
    age: {
        type: String
    },
    currentYear: {
        type: String
    },
    stream: {
        type: String
    },
    mobileNumber: {
        type: String
    },
    gender: {
        type: String,
        default: 'NONE'
    },
    eventParticipated: [{
        eventName: String,
        eventCode: String,
        time: Date,
        rank: Number
    }]

});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);