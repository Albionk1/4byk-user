const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
let countries = ["AF","AX","AL","DZ","AS","AD","AO","AI","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BQ","BA","BW","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CK","CR","CI","HR","CU","CW","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ET","FK","FJ","FI","FR","PF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GU","GT","GG","GN","GW","HT","VA","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KS","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PL","PT","PR","QA","RO","RU","RW","BL","KN","LC","MF","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","KR","SS","ES","LK","SD","SR","SZ","SE","CH","SY","TW","TJ","TZ","TH","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","US","UY","UZ","VU","VE","VN","VI","YE","ZM","ZW"]
const userSchema = new mongoose.Schema(
  {
    full_name: {
        type: String,
        required: [true, 'Fullname is required'],
      },
    role: {
      type: String,
      enum: {
        values: [
          'user',
          'admin',
        ],
        message: `Role is not correct`,
      },
      required: [true, 'Role is required'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'blog',
          'forum',
          'seller',
        ],
        message: `Type is not correct`,
      },
      required: [ function () {
        return this.role !== 'admin'
      }, 'Type is required'],
    },
    gender: {
      type: String,
      enum: {
        values: [
          'male',
          'female',
        ],
        message: `Type is not correct`,
      },
      required: [ function () {
        return this.type == 'seller'
      }, 'gender is required'],
    },
    city: {
      type: String,
      required: [ function () {
        return this.type == 'seller'
      }, 'gender is required'],
    },
    address: {
      type: String,
      required: [ function () {
        return this.type == 'seller'
      }, 'Address is required'],
    },
    proffesion: {
      type: String,
      required: [ function () {
        return this.type !== 'seller'
      }, 'Proffesion is required'],
    },
    writenArticle: {
      type: Boolean,
      required: [ function () {
        return this.type !== 'seller'
      }, 'This is required'],
    },
   acount_type: {
      type: String,
      enum: {
        values: [
          'personal',
          'business',
        ],
        message: `Acount type is not correct`,
      },
      required: [ function () {
        return this.role !== 'admin'
      }, 'Acount type is required'],
    },
    image: {
      type: String,
    },
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
    password: {
      type: String,
      required: [true, 'Fjalëkalimi është i zbrazët'],
      // minlength: [8, "Fjalëkalimi duhet të jet më i gjatë se 8 karaktere"],
      trim: true,
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%^&*()_+|~=`{}[\]:";'<>?,./#\\-])[A-Za-z\d@$!%^&*()_+|~=`{}[\]:";'<>?,./#\\-]+$/.test(
            value
          )
        },
        message:
          'Fjalkalimi duhet të ketë më së paku një shkronjë të madhe një të vogël dhe një simbol dhe nje numër',
      },
    },
    country: {
      type: String,
      enum: {
        values:countries,
        message: `Autorizimi nuk është i saktë`,
      },
      required: [true, 'Autorizimi është i zbrazët'],
    },
    instagram_link: {
      type: String,
    },
    facebook_link: {
      type: String,
    }, 
    linkedIn_link: {
      type: String,
    }, 
    tiktok_link: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: [true, 'Perdoruesi duhet te ket nje status boolean'],
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
)


userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ $or: [{ email }, { username: email }] })
  if (user) {
    const auth = await bcrypt.compare(password, user.password)
    if (auth) {
      return user
    }
    if (!email.includes('@')) {
      throw Error('incorrect password username')
    } else {
      throw Error('incorrect password')
    }
  }
  if (!email.includes('@')) {
    throw Error('incorrect username')
  } else {
    throw Error('incorrect email')
  }
}


userSchema.statics.changepassword = async function (
  email,
  password,
  newPassword
) {
  const user = await this.findOne({ email })

  if (user) {
    const compare = await bcrypt.compare(password, user.password)
    if (compare) {
      user.password = newPassword
      user.save()
      return user
    }
    throw Error('incorrect password')
  }
}
userSchema.statics.changepasswordById = async function (
  id,
  password,
  newPassword
) {
  const user = await this.findById(id)

  if (user) {

    const compare = await bcrypt.compare(password, user.password)
    if (compare) {
      user.password = newPassword
      await user.save()
      return user
    }
    throw Error('incorrect password')
  }
}
// userSchema.pre('validate', function (next) {
//   if (this.role !== 'Postman' && this.password.length < 8) {
//     this.invalidate(
//       'password',
//       'Fjalëkalimi duhet të jet më i gjatë se 8 karaktere'
//     )
//   }
//   if (this.role === 'Postman' && this.password.length < 6) {
//     this.invalidate(
//       'password',
//       'Fjalëkalimi duhet të jet më i gjatë se 6 karaktere'
//     )
//   }
//   next()
// })
userSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
