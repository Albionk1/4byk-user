const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
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
          'seller',
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
          'business',
        ],
        message: `Role is not correct`,
      },
      required: [true, 'Role is required'],
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
    coutry: {
      type: String,
      enum: {
        values:countries,
        message: `Autorizimi nuk është i saktë`,
      },
      required: [true, 'Autorizimi është i zbrazët'],
    },
    city: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: [true, 'Perdoruesi duhet te ket nje status boolean'],
    },
    api_key: {
      type: String,
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
