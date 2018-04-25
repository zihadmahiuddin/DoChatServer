const net = require('net')
const server = net.createServer()
const PORT = 1234
const HTTP_PORT = 5000
const mongoose = require('mongoose')
const userSchema = require('./userschema')
const nodemailer = require('nodemailer')
const express = require('express')
const app = express()

let usersDb = mongoose.createConnection('mongodb://dochat:dochatsrv@localhost/usersDb')
let User = usersDb.model('user', userSchema)

server.on('listening', function () {
    console.log(`Server started on ${PORT}`)
})

server.on('connection', function (client) {
    console.log(`New client connected from ${client.remoteAddress}:${client.remotePort}`)
    client.on('data', function (data) {
        let strData = data.toString()
        console.log(strData)
        let packetType = strData.split('<s>')[0]
        let params = strData.split('<s>').slice(1, strData.length)
        let result = 'empty'
        switch (packetType) {
            case "login":
                login(params[0], params[1], function (res, usr) {
                    client.write(res)
                    console.log(usr)
                })
                break
            case "signup":
                signup(params[0], params[1], params[2], params[3], function (res, usr) {
                    client.write(res)
                    console.log(usr)
                    sendMail(usr)
                })
                break
            case "resendmail":
                resendMail(params[0], function (res, usr) {

                })
                break
            case "message":
                console.log('The message packet has not yet implemented!')
                result = 'The message packet has not yet implemented!'
                break
            default:
                console.log('Unknown packet received!', packetType)
                result = 'Unknown packet received!' + packetType
                break
        }
    })
})
server.listen(PORT, 'localhost')

function login(username, password, callback) {
    let user = User.findOne({ username: username }, function (err, res) {
        if (err) {
            callback('logMessage<s>500 Internal Server Error.', null)
        }
        if (res) {
            if (!res.activated) {
                callback('logMessage<s>Please activate your account first. Didn\'t receive an activation mail?<br /><p onclick="sendActivationMail()"Click here to resend!</p>', res)
            }
            else {
                if (res.password == password) {
                    callback('logMessage<s>Login successful!', res)
                }
                else {
                    callback('logMessage<s>Wrong password, <a href="resetpass.html">click here to reset!</a>', null)
                }
            }
        }
        else {
            let user = User.findOne({ email: username }, function (err, res) {
                if (err) {
                    callback('logMessage<s>500 Internal Server Error.', null)
                }
                if (res) {
                    if (!res.activated) {
                        callback('logMessage<s>Please activate your account first. Didn\'t receive an activation mail?<br /><p onclick="sendActivationMail()"Click here to resend!</p>', res)
                    }
                    else {
                        if (res.password == password) {
                            callback('logMessage<s>Login successful!', res)
                        }
                        else {
                            callback('logMessage<s>Wrong password, <a href="resetpass.html">click here to reset!</a>', null)
                        }
                    }
                }
                else {
                    console.log('User not found!')
                    callback('logMessage<s>User not found, <a href="signup.html">click here to sign up!</a>', null)
                }
            })
        }
    })
}

function signup(fullname, email, username, password, callback) {
    let user = User.findOne({ username: username }, function (err, res) {
        if (err) {
            callback('logMessage<s>500 Internal Server Error.', null)
        }
        if (res) {
            console.log('User already exists!')
            callback('logMessage<s>User already exists!', res)
        }
        else {
            let user = User.findOne({ email: username }, function (err, res) {
                if (err) {
                    callback('logMessage<s>500 Internal Server Error.', null)
                }
                if (res) {
                    console.log('User already exists!')
                    callback('logMessage<s>User already exists!', res)
                }
                else {
                    let usersCount = User.count.length
                    let newUser = new User({
                        username: username,
                        password: password,
                        email: email,
                        fullname: fullname,
                        id: usersCount + 1,
                        activated: false,
                        activationCode: generateRandomCode()
                    })
                    newUser.save(function (err) {
                        if (err) {
                            callback('logMessage<s>500 Internal Server Error.', null)
                        }
                    })
                    sendMail(newUser)
                    callback('logMessage<s>Account creation successful!<br />Take a look at your mailbox(including \'Spam\' category) to activate your account', newUser)
                }
            })
        }
    })
}

function message(text, buddyId, dateTime, type) {

}

// Activation

function generateRandomCode(count = 40) {
    let code = "";
    let availableChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < count; i++)
        code += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
    return code;
}

function generateActivationLink(usr) {
    if (HTTP_PORT != 80) {
        return `http://localhost:${HTTP_PORT}/activate/${usr.activationCode}`
    }
    else {
        return `http://localhost/activate/${usr.activationCode}`
    }
}

function resendMail(email, callback) {
    let user = User.findOne({ email: username }, function (err, res) {
        if (err) {
            callback('logMessage<s>500 Internal Server Error.', null)
        }
        if (res) {
            res.activationCode = generateRandomCode()
            sendMail(res)
            callback('logMessage<s>Mail sent, check your mailbox.', res)
        }
        else {
            console.log('User not found!')
            callback('logMessage<s>User not found, <a href="signup.html">click here to sign up!</a>', null)
        }
    })
}

function sendMail(usr) {
    let config = require('./config.json')
    console.log(config)
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: config.smtpEmail,
            pass: config.smtpPassword
        }
    });
    const mailOptions = {
        from: 'dochat.noreply@gmail.com',
        to: usr.email,
        subject: `Welcome to DoChat ${usr.fullname}, please activate your account!`,
        html: `<p>Welcome to DoChat ${usr.fullname}, please click <a href="${generateActivationLink(usr)}">this link</a> to activate your account.<br />If that button didn't work for you, follow the link below: <p>${generateActivationLink(usr)}</p></p>`,
    };
    transporter.sendMail(mailOptions, function (err, info) {
        if (err)
            console.log(err)
        else
            console.log(info);
    });
}

// Activation server

app.listen(HTTP_PORT, function () {
    console.log(`HTTP Server started on ${HTTP_PORT}`)
})

app.get('/activate/:code', (req, resp) => {
    let activationCode = req.params.code
    let user = User.findOne({ activationCode: activationCode }, function (err, res) {
        if (err) {
            resp.status(500).send('500 Internal Server Error.')
        }
        if (res) {
            if (!res.activated) {
                res.activated = true
                res.save(function (err) {
                    if (err) {
                        resp.status(500).send('500 Internal Server Error.')
                    }
                })
                if (res.activated) {
                    resp.status(202).send('Successfully activated!')
                    console.log(res)
                }
            }
            else {
                resp.status(506).send('Already activated!')
            }
        }
        else {
            console.log('Invalid activation key!')
            resp.status(400).send('Invalid activation key!')
        }
    })
})