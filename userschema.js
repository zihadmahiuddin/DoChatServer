const mongoose = require('mongoose')
var Schema = mongoose.Schema;

module.exports = new Schema({
    username: String,
    password: String,
    email: String,
    fullname: String,
    id: Number,
    messages: [
        {
            buddyId: Number, time: Date, text: String, type: Number
        }
    ]
});