const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema(
  {
    by:{
      type: mongoose.Schema.ObjectId,
      required: [true, 'Klienti duhet ti takoj një user'],
      ref: 'User',
    },
    to:{
      type: mongoose.Schema.ObjectId,
      required: [true, 'Klienti duhet ti takoj një user'],
      ref: 'User',
    },
    message:{
      type:String
    },
    status:{
      type:String,
      enum: {
         values: ["delivered", "seen"],
         message: `Status nuk është i saktë`,
       },
       default: 'delivered',
    }
  },
  {
    timestamps: true,
  }
)

const Message = mongoose.model('Message', messageSchema)

module.exports = Message
