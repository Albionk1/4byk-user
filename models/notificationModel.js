const mongoose = require('mongoose')
const notificationSchema = new mongoose.Schema(
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
    url:{
      type:String
    },
    n_type:{
      type:String,
      enum: {
         values: ["reel", "forum",'like','follow','comment','general','mention','share','event_invitation','system_updates','profile_visit','activity_deleted'],
         message: `Status nuk është i saktë`,
       },
       default: 'delivered',
    },
    status:{
      type:String,
      enum: {
         values: ["delivered", "seen"],
         message: `Status nuk është i saktë`,
       },
       default: 'delivered',
    },
    payload:{
      type:mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
  }
)

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification
