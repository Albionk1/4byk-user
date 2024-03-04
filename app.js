const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
var bodyParser = require('body-parser')
const cors = require('cors');
const { uploadFile, getFileStream, deleteImage } = require('./aws')

const authRouter = require('./routes/authRoutes')
const authRouterMobile = require('./routes/mobileRoutes/authRoutesMobile')
const messageRouter = require('./routes/messageRoutes')
const notificationRouter = require('./routes/notificationRoutes')
const User = require('./models/userModel')


const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

process.on('uncaughtException', function (err) {
  console.log('error:uncaughtException')
  console.error(err);
  // Do something to handle the error
});

const http = require('http')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const socketMiddleware = require('./middlewares/socketMiddleware')
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json('application/json'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
const { addUser, removeUser, getUser, editRoom } = require('./utils')


app.get('/images/:key', (req, res) => {
  const key = req.params.key
  try {
    try {
      getFileStream(key, res)
    } catch (error) {
      console.log(error)
    }
  } catch (error) {
    console.log(error)
  }
})

app.use('/', authRouter)
app.use('/api/v1/mobile/auth', authRouterMobile)
app.use('/message', messageRouter)
app.use('/notification', notificationRouter)


//app.use('/', clientRouter)
// app.use('/auth', authRouter)
// app.use('/agency', agencyRouter)
// app.use('/agent', agentRoutes)
// mongoose.connect(process.env.DATABASE, { useNewUrlParser: true })
// const db = mongoose.connection
// db.on('error', console.error.bind(console, 'connection error:'))

mongoose.connect(process.env.DATABASE, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))

io.on('connection', (socket) => { 
app.use(socketMiddleware(socket))
  socket.on('join', ({ myId, client }) => { 
    removeUser(socket.id)
    const user = addUser({ id: socket.id, userId: myId, client })
    socket.join(user.userId)
    if (client) {
      socket.join(client)
    }
  })
  socket.on('joinRoom', ({ myId, otherUserId }) => {
    
    // Concatenate the user IDs in a consistent order
    const roomId = [myId, otherUserId].join('')
    const userOnSocket = getUser(myId) 
    if (userOnSocket) {
      socket.leave(userOnSocket.room)
      const user = editRoom({ userId: myId, room: roomId })
      socket.join(roomId)
    }
  })
  socket.on('leaveRoom', ({ userId }) => {
    // Concatenate the user IDs in a consistent order 
    const userOnSocket = getUser(userId)
    if (userOnSocket) {
      socket.leave(userOnSocket.room)
      const user = editRoom({ userId, room: ''}) 
 
    }
  })
  socket.on('messageSend', async({ userId,myId, message }) => { 
    const user = getUser(userId) 
    if (user) { 
      if (user.room==[userId,myId.toString()].join('')) {
       return io.to(user.userId).emit('reciveMessageRoom', { recivemessage: message,offert:false})
      }
      if (!user.room && user.userId) {
        io.to(user.userId).emit('reciveMessage', {myId:myId.toString(), message,offert:false })
      }
    }
    // else{ 
    //   const userToken = await User.findById(userId).select('fcm_token')
    //   if(userToken){
    //     sendMessage("Hejposta", message,userToken.fcm_token);
    //   }    
    // }
  })
  socket.on('offertSend', async({ userId,myId, message,price,title,image }) => { 
    const user = getUser(userId) 
    if (user) { 
      if (user.room==[userId,myId.toString()].join('')) {
       return io.to(user.userId).emit('reciveOffertMessageRoom', { recivemessage: message,offert:true,price,title,image})
      }
      if (!user.room && user.userId) {
        io.to(user.userId).emit('reciveMessage', {myId:myId.toString(), message,offert:true,price,title,image })
      }
    }
    // else{ 
    //   const userToken = await User.findById(userId).select('fcm_token')
    //   if(userToken){
    //     sendMessage("Hejposta", message,userToken.fcm_token);
    //   }    
    // }
  })
  socket.on('disconnect', () => {
    removeUser(socket.id)
  })
})

server.listen(process.env.PORT, () => {
    console.log(`App running on port ${process.env.PORT}...`);
});
