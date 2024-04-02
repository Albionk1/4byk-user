const mongoose = require('mongoose')

const forgotPasswordSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, 'Tokeni është i zbrazët'],
        trim: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'Tokeni duhet ti takoj nje useri'],
        ref: 'User',
    },
    expire_date:{
        type:String
    }
})



const ForgotPasswordToken = mongoose.model('ForgotPasswordToken', forgotPasswordSchema)

module.exports = ForgotPasswordToken