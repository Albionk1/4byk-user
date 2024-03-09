const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const requireAuthMobile = (req, res, next) => { 
  try{
    const token = req.headers.token
    if (token) {
      jwt.verify(token, process.env.SECRET, async (err, decodedToken) => { 
        if (err) {
          res.status(401).send({message:' Unauthorized '})
        } else {
          let  user = await User.findById(decodedToken.id)
          if (user) {
            req.user=user
            if(user.isActive){
              next()
            }else{
              res.status(401).send({message:' Unauthorized '})
            }
          }else{
             res.status(401).send({message:' Unauthorized '})
          } 
        }
      })
    } else {
       res.status(401).send({message:' Unauthorized '})
    }
  }
  catch(e){
  console.log(e)
  res.status(401).send({message:'Something went wrong '})
  }
 
}

 const authRole=(role) =>{
  return  (req, res, next) => {
   if(req.user){
    if (role.includes(req.user.role)) {
      next()
    }else{
      return   res.status(401).send({message:' Unauthorized '})
    }
  }
  else{
    return  res.status(401).send({message:' Unauthorized '})
  }
}

}

 module.exports = {
   requireAuthMobile,
   authRole
 }