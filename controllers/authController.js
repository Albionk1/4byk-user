const User = require('../models/userModel')
const url = require('url')
const maxAge = 3 * 24 * 60 * 60
const jwt = require('jsonwebtoken')
const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: maxAge,
  })
}
// const { uploadFile, getFileStream, deleteImage } = require('../aws')

const handleErrors = (err) => {
  let errors = {}
  // incorrect email in login form
  if (err.message === 'incorrect username') {
    errors.error = 'Emri i përdoruesit ose fjalëkalimi është gabim'
    return errors
  }
  if (err.message === 'incorrect email') {
    errors.error = 'Adresa elektronike ose fjalëkalimi është gabim'
    return errors
  }
  if (err.message === 'access') {
    errors.error = 'Ju nuk keni autorizim për tu kyqur'
    return errors
  }
  // incorrect password in login form
  if (err.message === 'incorrect password') {
    errors.error = 'Adresa elektronike ose fjalëkalimi është gabim'
    return errors
  }
  if (err.message === 'incorrect password username') {
    errors.error = 'Emri i përdoruesit ose fjalëkalimi është gabim'
    return errors
  }
  if (err.message === 'invalid file') {
    errors.image = 'Fotoja nuk është në formatin e duhur'
    return errors
  }
  //duplicate email error
  if (err.code === 11000) {
    if (err.message.includes('email_1')) {
      errors.email = 'Kjo adresë elektronike tashmë egziston'
    }
    if (err.message.includes('username_1')) {
      errors.username = 'Ky emër i përdoruesit tashmë egziston'
    }
    return errors
  }

  //errors in register form checking for errors from userModel

  for (var key in err.errors) {
    if (err.errors[key]) {
      errors[key] = err.errors[key].message
    }
  }
  return errors
}
module.exports.login = async (req, res) => {
    const { username, password } = req.body
    try {  
      const user = await User.login(username, password)
      if (user.isActive !== false) {
        const token = createToken(user._id)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
        res.send({ data: { user },cookie:token })
      } else {
        throw Error('access')
      }
    } catch (e) {
      console.log(e)
      const errors = handleErrors(e)
      res.status(400).json({ errors })
    }
  }

module.exports.addUserBlog = async(req,res)=>{
  try{
 const {full_name,country,email,password,acount_type,proffesion,writenArticle,instagram_link,facebook_link,linkedIn_link,tiktok_link} = req.body
 const user = await User.create({full_name,role:'user',country,email,password,type:'blog',acount_type,proffesion,writenArticle,instagram_link,facebook_link,linkedIn_link,tiktok_link})
 res.send({status:'success',message:'User has been created'})
  }
  catch(e){
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}

module.exports.addUserForum = async(req,res)=>{
  try{
 const {full_name,country,email,password,acount_type,proffesion,writenArticle,instagram_link,facebook_link,linkedIn_link,tiktok_link} = req.body
 const user = await User.create({full_name,role:'user',country,email,password,type:'forum',acount_type,proffesion,writenArticle,instagram_link,facebook_link,linkedIn_link,tiktok_link})
 res.send({status:'success',message:'User has been created'})
  }
  catch(e){
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}

module.exports.addUserSeller = async(req,res)=>{
  try{
 const {full_name,country,email,password,acount_type,proffesion,writenArticle,city,address,gender,bio} = req.body
 const user = await User.create({full_name,role:'user',country,email,password,type:'seller',acount_type,proffesion,writenArticle,city,address,gender,bio})
 res.send({status:'success',message:'User has been created'})
  }
  catch(e){
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}

module.exports.getUserById = async(req,res)=>{
  try{
     const id = req.body.id
     const user = await User.findById(id)
     res.send(user)
  }
  catch(e){
   res.send('')
  }
}