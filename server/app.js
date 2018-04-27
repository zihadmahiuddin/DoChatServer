const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');

const {User} = require('./../database/models/User');

io.on('connection', (socket) => {
    socket.on('signup', (data) => {
        socket.join(data.hash);

        if(data.username && data.password && data.email) {
            const email = data.email;
            const username = data.username;
            const password = data.password;

            User.find({email})
                .then(res => {
                    if (res) {
                        io.in(data.hash).emit('signup error', {
                            message: 'Email already exists.'
                        });
                    }

                    const encryptedPassword = password_hash(password);

                    User.insertMany({
                        email: email,
                        username: username,
                        salt: encryptedPassword.salt,
                        hash: encryptedPassword.hash
                    }).then(res => {
                        io.in(data.hash).emit('signup success', {
                            message: 'Registered. Now login',
                            user: { username, email }
                        });
                    }).catch(err => console.log('SOME ERROR'));
                })
                .catch(err => console.log('Some ERROR'));
        }
    });
});

const password_hash = password => {
    const salt = crypto.randomBytes(128).toString('base64');
    const hash = pbkdf2(password, salt, 10000);

    return { salt, hash };
};

const password_verify = (password, saltAndHash) => {
    return saltAndHash.hash == pbkdf2(passwordAttempt, saltAndHash.salt, 10000);
};

http.listen(9339, () => console.log('listening on *:3000'));
