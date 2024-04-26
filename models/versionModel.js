const mongoose = require('mongoose')
const versionSchema = new mongoose.Schema({
version: {
      type: String,
      required: [true,'Version name është i zbrazët'],
      trim: true
   },
os:{
    type:String,
    required:[true,'Os eshte e zbrazet']
}
},
   {
      timestamps: true,
   })
   versionSchema.index({version: 'text'})
const Version = mongoose.model('Version', versionSchema)

module.exports = Version