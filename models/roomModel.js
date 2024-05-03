const mongoose = require('mongoose')
const roomSchema = new mongoose.Schema(
  {
    room:{
        type:String
      },
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      friend:{
        type:Boolean
      }
  },
  {
    timestamps: true,
  }
)

const Room = mongoose.model('Room', roomSchema)

module.exports = Room
