const net = require('net')
const server = net.createServer()
const PORT = 1234
const mongoose = require('mongoose')
const userSchema = require('./userschema')

let usersDb = mongoose.createConnection('mongodb://dochat:dochatsrv@localhost/usersDb')
let User = usersDb.model('user', userSchema)

server.on('listening', function(){
    console.log(`Server started on ${PORT}`)})

server.on('connection', function(client){
    console.log(`New client connected from ${client.remoteAddress}:${client.remotePort}`)
    client.on('data', function(data){
        let strData = data.toString()
        console.log(strData)
        let packetType = strData.split('<s>')[0]
        let params = strData.split('<s>').slice(1, strData.length)
        let result = 'empty'
        switch(packetType){
            case "login":
            login(params[0], params[1], function(res, usr){
                client.write(res)
                console.log(usr)
            })
            break
            case "signup":
            signup(params[0], params[1], params[2], params[3], function(res, usr){
                client.write(res)
                console.log(usr)
            })
            break
            case "message":
            console.log('The message packet has not yet implemented!')
            result = 'The message packet has not yet implemented!'
            break
            default:
            console.log('Unknown packet received!', packetType )
            result = 'Unknown packet received!' + packetType
            break
        }
    })
})
server.listen(PORT, 'localhost')

// function connectToDb(){
//     usersDb = mongoose.createConnection('mongodb://dochat:dochatsrv@ds155699.mlab.com:55699/dochat')
//     User = usersDb.model('user', userSchema)
// }

function login(username, password, callback){
   let user = User.findOne({username: username}, function(err, res){
    if(err) throw err
    if(res){
        if(!res.activated){
            callback('logMessage<s>Please activate your account first. Didn\'t receive an activation mail?<br /><p onclick="sendActivationMail()"Click here to resend!</p>', res)
        }
        if(res.password == password){
            callback('logMessage<s>Login successful!', res)
        }
        else{
            callback('logMessage<s>Wrong password, <a href="resetpass.html">click here to reset!</a>', null)
        }
    }
    else{
        let user = User.findOne({email: username}, function(err, res){
            if(err) throw err
            if(res){
                if(res.password == password){
                    callback('logMessage<s>Login successful!', res)
                }
                else{
                    callback('logMessage<s>Wrong password, <a href="resetpass.html>click here to reset!</a>', null)
                }
            }
            else{
                console.log('User not found!')
                callback('logMessage<s>User not found, <a href="signup.html">click here to sign up!</a>', null)
            }
        })
    }
   })
}

function signup(fullname, email, username, password, callback){
    let user = User.findOne({username: username}, function(err, res){
     if(err) throw err
     if(res){
        console.log('User already exists!')
        callback('logMessage<s>User already exists!', res)
     }
     else{
         let user = User.findOne({email: username}, function(err, res){
             if(err) throw err
             if(res){
                console.log('User already exists!')
                callback('logMessage<s>User already exists!', res)
             }
             else{
                 let usersCount = User.count.length
                 let newUser = new User({
                   username: username,
                   password: password,
                   email: email,
                   fullname: fullname,
                   id: usersCount + 1,
                   activated: false
                 })
                 newUser.save(function(err){
                     if(err) throw err
                 })
                 callback('logMessage<s>Account creation successful!<br />Take a look at your mailbox(including \'Spam\' category) to activate your account', newUser)
             }
         })
     }
    })
 }

function message(text, buddyId, dateTime, type){
    
}
