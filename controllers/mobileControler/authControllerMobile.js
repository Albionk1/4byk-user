const User = require('../../models/userModel')
const url = require('url')
const maxAge = 30 * 24 * 60 * 60
const jwt = require('jsonwebtoken')
const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: maxAge,
  })
}
const Follow = require('../../models/followModel')
const Message = require('../../models/messageModel')
const { uploadFile, getFileStream, deleteImage } = require('../../aws')
const mongoose = require('mongoose')

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
    try {  
    const { email, password,fcm_token } = req.body
      const user = await User.login(email, password)
      if (user.isActive !== false) {
        if(user.deleted){
          throw Error('incorrect password')
        }
        const token = createToken(user._id)
        if(!user.fcm_token.includes(fcm_token)&&fcm_token){
         user.fcm_token.push(fcm_token)
         await user.save()
        }
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
        res.send({ data: { user },token})
      } else {
        throw Error('access')
      }
    } catch (e) {
      // console.log(e)
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
 const {full_name,country,email,password,acount_type,instagram_link,facebook_link,linkedIn_link,tiktok_link,id} = req.body
 const user = await User.findByIdAndUpdate({full_name,role:'user',country,email,acount_type,instagram_link,facebook_link,linkedIn_link,tiktok_link})
 if(password){
  user.password=password
  await user.save()
 }
 res.send({status:'success',message:'updated'})
  }
  catch(e){
    const errors = handleErrors(e)
      res.status(400).json({ errors })
  }
}


module.exports.getUserById = async(req,res)=>{
  try{
     const id = req.body.id
     const user = await User.findById(id).select('-password -createdAt -updatedAt')
     res.send(user)
  }
  catch(e){
   res.send('')
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

module.exports.editProfileCover=async(req,res)=>{
  try{
    if (req.file) {
      req.body.cover = ''
        const result = await uploadFile(req.file)
          .then((result) => {
            req.body.cover = result.Key
          })
          .catch((error) => {
            console.log(error)
          })
      }
      const user = await User.findById(req.user._id)
      deleteImage(user.cover)
       user.cover = req.body.cover
       await user.save()
    res.send({status:'success',message:'Cover updated'})
  }
  catch(e){
   res.send({status:'fail',message:"Cover didn't updated"})
  }
}
module.exports.editName=async(req,res)=>{
  try{
    const full_name= req.body.full_name
    const user = await User.findById(req.user._id)
    user.full_name = full_name
    await user.save()
    res.send({status:'success',message:'name updated'})
  }
  catch(e){
   res.send({status:'fail',message:"name didn't updated"})

  }
}

module.exports.editBio=async(req,res)=>{
  try{
    const bio= req.body.bio
    const user = await User.findById(req.user._id)
    user.bio = bio
    await user.save()
    res.send({status:'success',message:'bio updated'})
  }
  catch(e){
   res.send({status:'fail',message:"bio didn't updated"})

  }
}

module.exports.getUsersForMessage = async(req,res)=>{
  try{
    const user = req.user._id
    const userForMessage = req.body.user
    const followers = await Follow.find({ friendId: user }).select('userId');
const following = await Follow.find({ userId: user }).select('friendId userId');
const followersIds = followers.map(follower => follower.userId.toString());
const followingIds = following.map(follow => follow.friendId.toString());
const mutualFriendsIds = followersIds.filter(id => followingIds.includes(id));
const messages = await Message.aggregate([
  {
    $match: {
      $or: [
        { $and: [{ by: new mongoose.Types.ObjectId(user) }, { offert: true }] },
        { $and: [{ to: new mongoose.Types.ObjectId(user) }, { offert: true }] }   
      ]
    }
  },
  {
    $group: {
      _id: {
        $cond: [
          { $gte: ["$by", "$to"] },
          { to: "$to", by: "$by" },
          { to: "$by", by: "$to" }
        ]
      }
    }
  },
  {
    $project: {
      _id: 0,
      users: ["$_id.by", "$_id.to"]
    }
  }
]);
messages.forEach(message => {
  if (message.users[0] !== user.toString()) {
    mutualFriendsIds.push(message.users[0]);
  }
  if (message.users[1] !== user.toString()) {
    mutualFriendsIds.push(message.users[1]);
  }
});
if(userForMessage){
  if(!mutualFriendsIds.includes(userForMessage))mutualFriendsIds.push(userForMessage);
}
const mutualFriends = await User.find({ _id: { $in: mutualFriendsIds } }).select('_id full_name image')
res.send(mutualFriends)
  }
  catch(e){
    res.send([])
  }
}

module.exports.searchUsers = async(req,res)=>{
  try{
      const {search,date} = req.query
      const filter ={ 'full_name': { $regex: search, $options: 'i' }, deleted: false }
      if(date){
        filter.updatedAt ={$lte:date}
       }
      const user = await User.find(filter).limit(20).sort({updatedAt:-1}).select('full_name image cover')
      res.send({status:'success',data:user})
  }
  catch(e){
    res.send({status:'fail',data:[]})
  }
}

module.exports.deleteAccount = async(req,res)=>{
  try {  
    const { email, password } = req.body
      const user = await User.login(email, password)
      if (user.deleted !== false) {
        throw Error('incorrect password')
      } else {
        res.cookie('jwt', '', { httpOnly: true, maxAge: 1 })
        user.deleted = true
        await user.save()
        res.send({status:'true',message:'deleted'})
      }
    } catch (e) {
      const errors = handleErrors(e)
      res.status(400).json({ errors })
      
    }
}