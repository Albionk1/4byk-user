const User = require('../models/userModel')
const jwt = require('jsonwebtoken')

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, process.env.SECRET, async (err, decodedToken) => {
      if (err) {
        res.redirect('/')
      } else {
        let user = await User.findById(decodedToken.id)
        if (!user) {
          return res.redirect('/')
        }
        if (user) {
          req.user = user
          res.locals.user = user
        }
        next()
      }
    })
  } else {
    res.redirect('/')
  }
}

function authRole(role) {
  return (req, res, next) => {
    if(!req.user){
    const token = req.cookies.jwt
    if (token) {
      jwt.verify(token, process.env.SECRET, async (err, decodedToken) => {
        if (decodedToken) {
          let user = await User.findById(decodedToken.id)
          if (user) {
            if (role.includes(user.role)) {
              next()
            } else {
              res.redirect('back')
            }
          } else {
            res.redirect('back')
          }
        } else {
          res.redirect('back')
        }
      })
    } else {
      res.redirect('back')
    }
  }else{
    if (role.includes(req.user.role)) {
      next()
    }else{
      res.redirect('back')
    }
  }
}

}



const checkUser = async (req, res, next) => {
  //Meta cookie
  // res.locals.seoTags = await SeoTags.findOne()

  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, process.env.SECRET, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null
        next()
      } else {
        let user = await User.findById(decodedToken.id)
        if (user) {
          res.locals.user = user
          next()
        } else {
          res.locals.user = null
          next()
        }
      }
    })
  } else {
    res.locals.user = null
    next()
  }
}

const accessStaff = (access) => {
  return (req, res, next) => {
    if (req.user) {
      if (req.user&&req.user.role === 'superadmin') {
        return next()
      }
      if (req.user&& req.user.role === 'admin') {
        if (req.user.access.includes(access)) {
          return next()
        } else {
          return res.redirect('back')
        }
      } else {
        return res.redirect('back')
      }
    } else {
      return res.redirect('back')
    }
  }
}

const checkLogin = (req, res, next) => {
  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, process.env.SECRET, async (err, decodedToken) => {
      if (err) {
        return next()
      }
      const user = await User.findById(decodedToken.id)
      if (!user) {
        return next()
      } else {
        if (user.role === 'Service') {
          return res.redirect('/admin/index')
        }
      }
    })
  } else {
    next()
  }
}



// Define the API key validation middleware


module.exports = {
  requireAuth,
  authRole,
  checkUser,
  accessStaff,
  checkLogin,

}
