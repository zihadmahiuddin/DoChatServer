const PORT = 5000
const mongoose = require('mongoose')
const userSchema = require('./userschema')
const nodemailer = require('nodemailer')
const express = require('express')
const app = express()

let usersDb = mongoose.createConnection('mongodb://dochat:dochatsrv@127.0.0.1:27017/usersDb')
let User = usersDb.model('user', userSchema)

function login(username, password, callback) {
    let user = User.findOne({ username: username }, function (err, res) {
        if (err) {
            callback('logMessage<s>500 Internal Server Error.', null)
        }
        if (res) {
            if (!res.activated) {
                callback('logMessage<s><a href="#" onclick="sendActivationMail()">Please activate your account first. Didn\'t receive an activation mail? Click here to resend!', res)
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
                        callback('logMessage<s><a href="#" onclick="sendActivationMail()">Please activate your account first. Didn\'t receive an activation mail? Click here to resend!', res)
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
                    let usersCount
                    User.count({}, function (err, count) {
                        let newUser = new User({
                            username: username,
                            password: password,
                            email: email,
                            fullname: fullname,
                            id: count + 1,
                            activated: false,
                            activationCode: generateRandomCode(),
                            passwordResetCode: generateRandomCode()
                        })
                        newUser.save(function (err) {
                            if (err) {
                                callback('logMessage<s>500 Internal Server Error.', null)
                            }
                        })
                        sendMail(newUser)
                        callback('logMessage<s>Account creation successful!<br />Take a look at your mailbox(including \'Spam\' category) to activate your account', newUser)
                    })
                }
            })
        }
    })
}

function message(text, buddyId, dateTime, type) {

}

function generateRandomCode(count = 40) {
    let code = "";
    let availableChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < count; i++)
        code += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
    return code;
}

function resetPassword(email, callback) {
    let user = User.findOne({ username: username }, function (err, res) {
        if (err) {
            callback('logMessage<s>500 Internal Server Error.', null)
        }
        if (res) {
            if (!res.activated) {
                callback('logMessage<s>Please activate your account first. Didn\'t receive an activation mail?', res)
            }
            else {
                res.passwordResetCode = generateRandomCode()
                res.save(function (err) {
                    if (err) {
                        return callback('logMessage<s>500 Internal Server Error.', null)
                    }
                    sendPassResetMail(res)
                })
            }
        }
        else {
            let user = User.findOne({ email: username }, function (err, res) {
                if (err) {
                    callback('logMessage<s>500 Internal Server Error.', null)
                }
                if (res) {
                    if (!res.activated) {
                        callback('logMessage<s>Please activate your account first. Didn\'t receive an activation mail?<br /> <a onclick="sendActivationMail()">Click here to resend!</a>', res)
                    }
                    else {
                        res.passwordResetCode = generateRandomCode()
                        res.save(function (err) {
                            if (err) {
                                return callback('logMessage<s>500 Internal Server Error.', null)
                            }
                            sendPassResetMail(res)
                        })
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

// Activation
function generateActivationLink(usr) {
    if (PORT != 80) {
        return `http://localhost:${PORT}/api/activate/${usr.activationCode}`
    }
    else {
        return `http://localhost/api/activate/${usr.activationCode}`
    }
}

function resendMail(email, callback) {
    let user = User.findOne({ username: email }, function (err, res) {
        if (err) {
            callback('logMessage<s>500 Internal Server Error.', null)
        }
        if (res) {
            res.activationCode = generateRandomCode()
            res.save(function (err) {
                if (err) {
                    return callback('logMessage<s>500 Internal Server Error.', null)
                }
                sendMail(res)
                callback('logMessage<s>Mail sent, check your mailbox.', res)
            })
        }
        else {
            let user = User.findOne({ email: username }, function (err, res) {
                if (err) {
                    callback('logMessage<s>500 Internal Server Error.', null)
                }
                if (res) {
                    res.activationCode = generateRandomCode()
                    res.save(function (err) {
                        if (err) {
                            return callback('logMessage<s>500 Internal Server Error.', null)
                        }
                        sendMail(res)
                        callback('logMessage<s>Mail sent, check your mailbox.', res)
                    })
                }
                else {
                    console.log('User not found!')
                    callback('logMessage<s>User not found, <a href="signup.html">click here to sign up!</a>', null)
                }
            })
        }
    })
}

function generatePasswordResetLink(usr) {
    if (PORT != 80) {
        return `http://localhost:${PORT}/api/resetPass/${usr.passwordResetCode}`
    }
    else {
        return `http://localhost/api/resetPass/${usr.passwordResetCode}`
    }
}

function sendPassResetMail(usr) {
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
        from: config.smtpEmail,
        to: usr.email,
        subject: `Thanks for using DoChat ${usr.fullname}, did you request a password reset?`,
        html: `<p>Thanks for being with DoChat ${usr.fullname}, please click <a href="${generatePasswordResetLink(usr)}">this link</a> to reset your password.<br />If that button didn't work for you, follow the link below: <p>${generateActivationLink(usr)}</p></p><br /><strong>NOTE:</strong><p> If you didn't make this request, please ignore this mail</p>.<br /><p>Thanks</p>`,
    };
    transporter.sendMail(mailOptions, function (err, info) {
        if (err)
            console.log(err)
        else
            console.log(info);
    });
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

// HTTP Server

app.listen(PORT, function () {
    console.log(`HTTP Server started on ${PORT}`)
})

app.get('/api/login/:username/:password', (req, res) => {
    login(req.params.username, req.params.password, (resp, usr) => {
        if (usr && resp) {
            return res.status(200).send(resp)
        }
        return res.status(500).send('Internal server error, please contact the admin.')
    })
})

app.get('/api/signup/:fullname/:email/:username/:password', (req, res) => {
    signup(req.params.fullname, req.params.email, req.params.username, req.params.password, (resp, usr) => {
        if (usr && resp) {
            return res.status(200).send(resp)
        }
        return res.status(500).send('Internal server error, please contact the admin.')
    })
})

app.get('/api/activation/:email', (req, res) => {
    resendMail(req.params.email, function (msg, usr) {
        if (msg && usr) {
            return res.status(200).send(msg)
        }
        return res.status(500).send('500 Internal server error.')
    })
})



app.get('/api/activate/:code', (req, resp) => {
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