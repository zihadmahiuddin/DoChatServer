const net = require('net')
const server = net.createServer()

server.listen(9339, '127.0.0.1')

server.on('listening', function(){
    console.log('Started!')
})
server.on('connection', function(client){
    console.log(`New client connected from ${client.remoteAddress}:${client.remotePort}`)
    client.on('data', function(data){
        console.log(data.toString())
    })
})