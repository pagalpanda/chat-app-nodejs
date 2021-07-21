const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { SocketAddress } = require('net')
const Filter = require('bad-words')
const generateMessage = require('./utils/messages')

const {addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000 

const publicDirPath = path.join(__dirname, '../public')
app.use(express.static(publicDirPath))

io.on('connection', (socket) => {
    console.log('new websocket connection!')
    
    socket.on('join', ({username, room}, callback) => {
        const {error, user } = addUser({
            id: socket.id, // socket.id is unique per connection
            username: username,
            room:room
        }) 
        if(error) {
            return callback(error)
        }
        socket.join(user.room) // sends messages only to that room string
        //io.emit -- sends message to all connected clients
        //socket.emit -- sends message to a single client
        //socker.broadcast.emit -- sends message to all clients except source
        //io.to.emit -- emits message to everyone in a specific room
        //socket.broadcast.to.emit -- emits message to everyone in a specific room except the source client

        socket.emit('message',generateMessage('Admin', 'Welcome')) // sends message to just the client who is connected
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username, `${user.username} has joined!`)) // broadcasts the message. all connections except the current one.

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed') 
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message)) // message to all connected clients
        callback()
    })

    socket.on('disconnect', () => {
        const removedUser = removeUser(socket.id)
        if(removedUser) {
            io.to(removedUser.room).emit('message', generateMessage(removedUser.username, `${removedUser.username} has left!`))
        }
        io.to(removedUser.room).emit('roomData', {
            room: removedUser.room,
            users: getUsersInRoom(removedUser.room)
        })
    })

    socket.on('location', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${location.lat},${location.long}`)) // build url for clients to show gmap
        callback()

    })
    
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})