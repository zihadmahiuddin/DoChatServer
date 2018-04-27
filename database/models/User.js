const {mongoose} = require('./../mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
        required: true,
    },
    hash: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', userSchema);

module.exports = {User}
