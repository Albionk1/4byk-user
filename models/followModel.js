const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
//   status: {
//     type: String,
//     enum: ['pending', 'accepted', 'rejected'],
//     default: 'pending'
//   },
},{timestamps:true});

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;