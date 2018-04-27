const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://admin:password@ds161148.mlab.com:61148/smartstats');

module.exports = {mongoose};
