const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
var bodyParser = require('body-parser')

const viewRouter = require('./routes/viewRoutes')
const authRouter = require('./routes/authRoutes')
const apiRouter = require('./routes/apiRoutes')


const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

process.on('uncaughtException', function (err) {
  console.log('error:uncaughtException')
  console.error(err);
  // Do something to handle the error
});


const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json('application/json'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))








app.use('/', authRouter)


//app.use('/', clientRouter)
// app.use('/auth', authRouter)
// app.use('/agency', agencyRouter)
// app.use('/agent', agentRoutes)
// mongoose.connect(process.env.DATABASE, { useNewUrlParser: true })
// const db = mongoose.connection
// db.on('error', console.error.bind(console, 'connection error:'))


app.listen(process.env.PORT, () => {
    console.log(`App running on port ${process.env.PORT}...`);
});
