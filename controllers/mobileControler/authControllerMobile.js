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
const ForgotPassword= require('../../models/forgotPasswordModel')
const {sendForgotPasswordEmail,sendActivateEmail} = require('../../email')
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
  let user
    try {  
    const { email, password,fcm_token } = req.body
       user = await User.login(email, password)
      if (user.isActive !== false) {
        if(user.deleted){
          throw Error('incorrect password')
        }
        const token = createToken(user._id)
        if(!user.fcm_token.includes(fcm_token)&&fcm_token){
         user.fcm_token.push(fcm_token)
         await user.save()
        }
        res.send({ data: { user },token,status:'success'})
      } else {
          return res.send({status:'success',message:'Address verify'})
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
   const user = await User.create({full_name,role:'user',country,email,password,acount_type,bio,gender,category,language,image,isActive:false})
 sendActivateEmail(user.email,user.full_name,user._id)
 return res.send({status:'success',message:'Address verify'})
    }
    catch(e){
      const errors = handleErrors(e)
      deleteImage(req.body.image)
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
    res.send({status:'success',message:'Image updated',image:req.body.image})
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

module.exports.sendForgotPasswordEmail = async(req, res) => {
  try {
      const email = req.body.email
let language = req.body.language||'de'
      const user = await User.findOne({ email })
      if (!user) {
        if (language==='en')  return res.status(404).send({errors:{ message: 'Incorrect email address' }})
      if (language==='al')  return res.status(404).send({errors:{ message: 'Adresa elektronike është gabim' }})
      if (language ==='de') return res.status(404).send({errors:{ message: 'Falsche E-Mail Adresse' }})
      }

      const userAlreadyHasToken = await ForgotPassword.findOne({ user: user._id })

      if (userAlreadyHasToken) {
        if(userAlreadyHasToken.expire_date>Date.now().toString()){
          if (language==='en')  return res.status(400).send({errors:{ message: 'Check your email We have sent you a code for this account' }})
          if (language==='al')  return res.status(400).send({errors:{ message: 'Kontrolloni postën elektornike ju kemi derguar një kod për këtë llogari' }})
          if (language ==='de') return res.status(400).send({errors:{ message: 'Überprüfen Sie Ihre E-Mails. Wir haben Ihnen einen Code für dieses Konto gesendet' }})
        }
      else{
        await userAlreadyHasToken.deleteOne()
      }
      }


      const random = Math.random()
      const token = random.toString().slice('2', '8')


      const token_db = await ForgotPassword.create({
          token,
          user: user._id,
          expire_date:Date.now()+ (20 * 60 * 1000)
      })


      if (!token_db) {
        if (language==='en')  return res.status(400).send({errors:{ message: 'Something went wrong code not generated' }})
      if (language==='al')  return res.status(400).send({errors:{ message: 'Diçka shkoi keq kodi nuk u krijua' }})
      if (language ==='de') return res.status(400).send({errors:{ message: 'Es ist ein Fehler aufgetreten. Der Code wurde nicht generiert' }})
      }




      sendForgotPasswordEmail(email, user.full_name, token)
      if (language==='en')  return res.send({success:{ message: 'Email sent successfullyd' }})
      if (language==='al')  return res.send({success:{ message: 'Emaili u dërgua me sukses' }})
      if (language ==='de') return res.send({success:{ message: 'Email wurde erfolgreich Versendet' }})
  } catch (error) {
      res.status(500).send({
          errors:{
          message: 'This is a server error, check server console for more info',
      }})

  }
}

module.exports.rateUser = async (req, res) => {
  try {
    const { id, value, message, title } = req.body
    const user = await User.findOne({ _id: id, deleted: false })
    if (user) {
      const ratingIndex = user.ratings.findIndex(rating => rating.user.toString() === req.user._id.toString());
      if (ratingIndex === -1) {
        const newRating = {
          user: req.user._id,
          value,
          message,
          title,
          full_name: req.user.full_name,
          image:req.user.image
        };
        user.ratings.push(newRating);
        await user.save();
        const totalRating = user.ratings.reduce((acc, rating) => acc + rating.value, 0);
        user.rating = (totalRating / user.ratings.length).toFixed(1);
        await user.save()
        return res.send({ status: 'success', message: 'rated succesfully', rate: newRating })
      }
      return res.send({ status: 'fail', message: 'You have already rated' })
    }
    return res.send({ status: 'fail', message: 'Product not found' })
  }
  catch (e) {
    const errors = handleErrors(e)
    res.send({ status: 'fail', errors })

  }
}

module.exports.loginOrCreateGoogle = async(req,res)=>{
  try{
    let {googleId,email,full_name,fcm_token} = req.body
    if(!googleId){
      return res.status(400).json({ errors:{googleId:'Is empty'} }) 
    }
    let userGoogleId=await User.findOne({googleId})
    if(userGoogleId){
      const token = createToken(userGoogleId._id)
      if(!userGoogleId.fcm_token.includes(fcm_token)&&fcm_token){
        userGoogleId.fcm_token.push(fcm_token)
       await userGoogleId.save()
      }
      return  res.send({ data: { user:userGoogleId },token,status:'success'})
    }
    let userEmail = await User.findOne({email})
    if(userEmail){
      userEmail.googleId=googleId
     const token = createToken(userEmail._id)
     if(!userEmail.fcm_token.includes(fcm_token)&&fcm_token){
      userEmail.fcm_token.push(fcm_token)
     }
     await userEmail.save()
     return  res.send({ data: { user:userEmail },token,status:'success'})
    }
    function generateRandomText(length) {
      const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const specialChars = '!@#$%^&*()-_+=<>?';
  
      const allChars = uppercaseChars + lowercaseChars + numbers + specialChars;
  
      let randomText = '';
      randomText += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
      randomText += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
      randomText += numbers[Math.floor(Math.random() * numbers.length)];
      randomText += specialChars[Math.floor(Math.random() * specialChars.length)];
      for (let i = 0; i < length - 4; i++) {
          randomText += allChars[Math.floor(Math.random() * allChars.length)];
      }
      randomText = randomText.split('').sort(() => Math.random() - 0.5).join('');
  
      return randomText;
  }
  let user = await User.create({
    email,
    full_name,
    password: generateRandomText(12),
    gender: '', // Provide a default value or ensure it's properly populated
    role: 'user',
    acount_type: 'personal',
    country: '', // Provide a default value or ensure it's properly populated
    category: 'other', // Provide a default value or ensure it's properly populated
    language: 'en' ,
    googleId
})
user.googleId=googleId
const token = createToken(user._id)
if(!user.fcm_token.includes(fcm_token)&&fcm_token){
  user.fcm_token.push(fcm_token)
}
await user.save()
return  res.send({ data: { user },token,status:'success'})    
  }
  catch(e){
    const errors = handleErrors(e)
    res.status(400).json({ errors })
  }
}
module.exports.loginOrCreateApple = async(req,res)=>{
  try{
    let {appleId,email,full_name,fcm_token} = req.body
    if(!appleId){
      return res.status(400).json({ errors:{appleId:'Is empty'} }) 
    }
    let userFacebookId=await User.findOne({appleId})
    if(userFacebookId){
      const token = createToken(userFacebookId._id)
      if(!userFacebookId.fcm_token.includes(fcm_token)&&fcm_token){
        userFacebookId.fcm_token.push(fcm_token)
       await userFacebookId.save()
      }
      return  res.send({ data: { user:userFacebookId },token,status:'success'})
    }
    let userEmail = await User.findOne({email})
    if(userEmail){
      userEmail.appleId=appleId
     const token = createToken(userEmail._id)
     if(!userEmail.fcm_token.includes(fcm_token)&&fcm_token){
      userEmail.fcm_token.push(fcm_token)
     }
     await userEmail.save()
     return  res.send({ data: { user:userEmail },token,status:'success'})
    }
    function generateRandomText(length) {
      const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const specialChars = '!@#$%^&*()-_+=<>?';
  
      const allChars = uppercaseChars + lowercaseChars + numbers + specialChars;
  
      let randomText = '';
      randomText += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
      randomText += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
      randomText += numbers[Math.floor(Math.random() * numbers.length)];
      randomText += specialChars[Math.floor(Math.random() * specialChars.length)];
      for (let i = 0; i < length - 4; i++) {
          randomText += allChars[Math.floor(Math.random() * allChars.length)];
      }
      randomText = randomText.split('').sort(() => Math.random() - 0.5).join('');
  
      return randomText;
  }
  let user = await User.create({
    email,
    full_name,
    password: generateRandomText(12),
    gender: '', // Provide a default value or ensure it's properly populated
    role: 'user',
    acount_type: 'personal',
    country: '', // Provide a default value or ensure it's properly populated
    category: 'other', // Provide a default value or ensure it's properly populated
    language: 'en' ,
    appleId
})
user.appleId=appleId
const token = createToken(user._id)
if(!user.fcm_token.includes(fcm_token)&&fcm_token){
  user.fcm_token.push(fcm_token)
}
await user.save()
return  res.send({ data: { user },token,status:'success'})    
  }
  catch(e){
    const errors = handleErrors(e)
    res.status(400).json({ errors })
  }
}