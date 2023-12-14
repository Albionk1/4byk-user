const mongoose = require('mongoose')
const apiConnectionSchema = new mongoose.Schema(
  {
    service: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'eshte e zbrazet'],
        ref: 'User',
      },
    api_key_service: {
      type: String,
      required: [true, 'api_key është i zbrazët'],
    },
    api_key_mobile: {
      type: String,
      required: [true, 'api_key është i zbrazët'],
    },
    mobileShop:{
      type: mongoose.Schema.ObjectId,
      required: [true, 'eshte e zbrazet'],
      ref: 'User',
    },
    service_status:{
        type:Boolean,
        default:true
    },
    mobile_status:{
      type:Boolean,
      default:true
    }
  },
  {
    timestamps: true,
  }
)


const ApiConnection = mongoose.model('ApiConnection', apiConnectionSchema)

module.exports = ApiConnection
