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
    offert:{
      type:Boolean,
      default:false
    },
    title:{
      type:String
    },
    image:{
      type:String
    },
    price:{
      type:String
    },
    offert_ref:{
      type: mongoose.Schema.ObjectId,
      ref:'Product'
    },
    message:{
      type:String
    },
    room:{
    type:String
    },
    status:{
      type:String,
      enum: {
         values: ["delivered", "seen"],
         message: `Status nuk është i saktë`,
       },
       default: 'delivered',
    },
    offert_res:{
      type:Boolean
    }
  },
  {
    timestamps: true,
  }
)

const Message = mongoose.model('Message', messageSchema)

module.exports = Message
