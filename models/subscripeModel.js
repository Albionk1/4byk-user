const mongoose = require('mongoose');

const subscribeSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        required: [true,
          'Email is required',
        ],
        validate: {
          validator: function (v) {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v)
          },
          message: 'valide',
        },
      },
},{timestamps:true});

const Subscribe = mongoose.model('Subscribe', subscribeSchema);

module.exports = Subscribe;