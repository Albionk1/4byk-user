const User = require('../models/userModel')
const url = require('url')
const maxAge = 3 * 24 * 60 * 60
const jwt = require('jsonwebtoken')
const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: maxAge,
  })
}
const Follow = require('../models/followModel')
// const { uploadFile, getFileStream, deleteImage } = require('../aws')
const { uploadFile, getFileStream, deleteImage } = require('../aws')

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


module.exports.getUserImageById=async(req,res)=>{
  try{
  const ids=req.body.ids
  const userImges = await User.find({_ids:{$in:ids}}).select('image')
  res.send(userImges)
 }
 catch(e){
  res.send([])
 }
}
module.exports.getUsersFilter=async(req,res)=>{
  try{
  const filter = req.body.filter
  const select = req.body.select
  const skip = parseInt(req.body.skip)
  const limit = parseInt(req.body.limit)
  const data= await User.find(filter).select(select).skip(skip)
  .limit(limit).lean()
  let totalCount = await User.countDocuments(filter)
  res.send([data,totalCount])
 }
 catch(e){
  res.send([[],0])
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
module.exports.login = async (req, res) => {
    try {  
    const { email, password } = req.body
      const user = await User.login(email, password)
      if (user.isActive !== false) {
        const token = createToken(user._id)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
        res.send({ data: { user },cookie:token })
      } else {
        throw Error('access')
      }
    } catch (e) {
      const errors = handleErrors(e)
      res.status(400).json({ errors })
      
    }
  }

module.exports.addUser = async(req,res)=>{
  try{
    if (req.file) {
    req.body.image = ''
      const result = await uploadFile(req.file)
        .then((result) => {
          req.body.image = result.Key
        })
        .catch((error) => {
          console.log(error)
        })
    }
 const {full_name,country,email,password,acount_type,bio,gender,category,language,image} = req.body
 const user = await User.create({full_name,role:'user',country,email,password,acount_type,bio,gender,category,language,image})
 res.send({status:'success',message:'added'})
  }
  catch(e){
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}

module.exports.updateUser = async(req,res)=>{
  try{
 const {full_name,country,email,password,acount_type,instagram_link,facebook_link,linkedIn_link,tiktok_link,gender,category,bio,phone_number,address} = req.body
 const user = await User.findByIdAndUpdate(req.user._id,{full_name,country,email,acount_type,instagram_link,facebook_link,linkedIn_link,tiktok_link,gender,category,bio,phone_number,address})
 if(password){
  user.password=password
  await user.save()
 }
 res.send({status:'success',message:'updated'})
  }
  catch(e){
    console.log(e)
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}

module.exports.editProfilePic=async(req,res)=>{
  try{
    if (req.file) {
      req.body.image = ''
        const result = await uploadFile(req.file)
          .then((result) => {
            req.body.image = result.Key
          })
          .catch((error) => {
            console.log(error)
          })
      }
      const user = await User.findById(req.user._id)
      deleteImage(user.image)
       user.image = req.body.image
       await user.save()
    res.send({status:'success',message:'Image updated'})
  }
  catch(e){
   res.send({status:'fail',message:"Image didn't updated"})
  }
}
module.exports.deleteUser=async(req,res)=>{
  try{
    const user = await User.findByIdAndUpdate(req.body.id,{deleted:true,isActive:false})
   res.send({status:'success',message:'User deleted successfuly'})
  }
  catch(e){

   res.send({status:'fail',message:"not delited"})
  }
}
module.exports.addAdmin = async(req,res)=>{
  try{
    req.body.image = ''
    if (req.file) {
      const result = await uploadFile(req.file)
        .then((result) => {
          req.body.image = result.Key
        })
        .catch((error) => {
          console.log(error)
        })
    }
 let {full_name,email,password,access,image,bio} = req.body
    if(!image){
      image = 'blank.png'
   }
 const user = await User.create({full_name,role:'admin',email,password,access,image,bio})
 res.send({status:'success',message:'added'})
  }
  catch(e){
    if (req.file) {
      deleteImage(req.body.image)
    }
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}


module.exports.getAdminList = async (req, res) => {
  try {
    const skip = parseInt(req.query.start)
    const limit = parseInt(req.query.length)
    const search = req.query.search.value
    const order = {}

    if (req.query.order[0].column === '0') {
      order['createdAt'] = req.query.order[0].dir === 'asc' ? 1 : -1
    }

    const data = await User.find({role:'admin',deleted:false,isActive:true,'full_name': { $regex: search, $options: 'i'  }}).skip(skip)
    .limit(limit).select('_id image full_name email access')
    .lean()
    const totalCount = await User.countDocuments({role:'admin',deleted:false,isActive:true,'full_name': { $regex: search, $options: 'i'  }})
    for (var i = 0; i < data.length; i++) {
      data[i].nr = i + 1 + skip || 1 * limit
    }
    res.json({
      recordsTotal: totalCount ? totalCount : 0,
      recordsFiltered: totalCount ? totalCount: 0,
      data,
    })
  } catch (e) {
    console.log(e)
  }
}
module.exports.editAdmin = async(req,res)=>{
  try{
    req.body.image = ''
    if (req.file) {
      const result = await uploadFile(req.file)
        .then((result) => {
          req.body.image = result.Key
        })
        .catch((error) => {
          console.log(error)
        })
    }
 let {full_name,email,password,access,image,bio,id} = req.body
    if(!image){
      image = 'blank.png'
   }
 const user = await User.findOneAndUpdate({_id:id,role:'admin'},{full_name,email,access,bio}) .then(async (user) => {
  if (req.file) {
    deleteImage(user.image)
    user.image = image
    await user.save()
  }
  if(password){
    user.password = password
    await user.save()
  }
})
 res.send({status:'success',message:'added'})
  }
  catch(e){
    if (req.file) {
      deleteImage(req.body.image)
    }
    console.log(e)
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}
module.exports.deleteAdmin=async(req,res)=>{
  try{
    const id = req.body.id
    const user = await User.findOneAndUpdate({_id:id,role:'admin'},{isActive:false})
    if(user){
      res.send({status:'success',message:'User deleted'})
    }
    if(!user){
      res.send({status:'fail',message:'Failed to delete user'})
    }
  }
  catch(e){
    console.log(e)
  }
}

module.exports.getUserIndividTable = async (req, res) => {
  try {
    const skip = parseInt(req.query.start)
    const limit = parseInt(req.query.length)
    const search = req.query.search.value
    const order = {}

    if (req.query.order[0].column === '0') {
      order['createdAt'] = req.query.order[0].dir === 'asc' ? 1 : -1
    }

    const data = await User.find({role:'user',deleted:false,isActive:true,'full_name': { $regex: search, $options: 'i'  },acount_type:'personal'}).skip(skip)
    .limit(limit).select('_id image full_name email category bio createdAt country')
    .lean()
    const totalCount = await User.countDocuments({role:'user',deleted:false,isActive:true,'full_name': { $regex: search, $options: 'i'  },acount_type:'personal'})
    for (var i = 0; i < data.length; i++) {
      data[i].nr = i + 1 + skip || 1 * limit
    }
    res.json({
      recordsTotal: totalCount ? totalCount : 0,
      recordsFiltered: totalCount ? totalCount: 0,
      data,
    })
  } catch (e) {
    console.log(e)
  }
}

module.exports.getUserBusinessTable = async (req, res) => {
  try {
    const skip = parseInt(req.query.start)
    const limit = parseInt(req.query.length)
    const search = req.query.search.value
    const order = {}

    if (req.query.order[0].column === '0') {
      order['createdAt'] = req.query.order[0].dir === 'asc' ? 1 : -1
    }

    const data = await User.find({role:'user',deleted:false,isActive:true,'full_name': { $regex: search, $options: 'i'  },acount_type:'business'}).skip(skip)
    .limit(limit).select('_id image full_name email category bio createdAt country')
    .lean()
    const totalCount = await User.countDocuments({role:'user',deleted:false,isActive:true,'full_name': { $regex: search, $options: 'i'  },acount_type:'business'})
    for (var i = 0; i < data.length; i++) {
      data[i].nr = i + 1 + skip || 1 * limit
    }
    res.json({
      recordsTotal: totalCount ? totalCount : 0,
      recordsFiltered: totalCount ? totalCount: 0,
      data,
    })
  } catch (e) {
    console.log(e)
  }
}

module.exports.follow = async(req,res)=>{
  try{
    const follow = await Follow.findOne({userId:req.user._id,friendId:req.body.friend})
    if(follow){
      await follow.deleteOne()
      return res.send({status:'success',message:'removed'})
    }
    else{
      await Follow.create({userId:req.user._id,friendId:req.body.friend})
      return res.send({status:'success',message:'added'})
    }
  }
  catch(e){
    res.send({status:'fail'})
  }
}

module.exports.logout = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 })
  res.redirect('/login')
}