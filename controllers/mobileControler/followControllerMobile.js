const User = require('../../models/userModel')
const Follow = require('../../models/followModel')
const url = require('url')
const maxAge = 3 * 24 * 60 * 60
const jwt = require('jsonwebtoken')
const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: maxAge,
  })
}
// const { uploadFile, getFileStream, deleteImage } = require('../aws')
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
     console.log(e)
     res.send({status:'fail'})
   }
 }
 
 module.exports.getFollowStatus = async(req,res)=>{
   try{
     let followingStatus = false
     let followerStatus = false
     const following = await Follow.countDocuments({userId:req.user._id,friendId:req.query.friend})
     const follower = await Follow.countDocuments({friendId:req.user._id,userId:req.query.friend})
     if(following) followingStatus =true
     if(follower) followerStatus =true
     res.send({status:'success',followingStatus,followerStatus})
   }
   catch(e){
     res.send({status:'fail',followingStatus:false,followerStatus:false})
   }
 }
 
 module.exports.getMyFollowing = async(req,res)=>{
  try{
    let pageNumber = parseInt(req.query.pageNumber)|| 0
    const following = await Follow.find({userId:req.user._id}).skip(pageNumber*10).limit(10)
    const totalFollowers = await Follow.countDocuments({userId:req.user._id})
    res.send({status:'success',following,totalFollowers})
  }
  catch(e){
    res.send({status:'fail',followers:0,totalFollowers:0})
  }
}
 
 module.exports.getMyFollowers = async(req,res)=>{
   try{
     let pageNumber = parseInt(req.query.pageNumber)|| 0
     const followers = await Follow.find({friendId:req.user._id}).skip(pageNumber*10).limit(10)
     const totalFollowers = await Follow.countDocuments({friendId:req.user._id})
     res.send({status:'success',followers,totalFollowers})
   }
   catch(e){
     res.send({status:'fail',followers:0,totalFollowers:0})
   }
 }
 module.exports.getAllMyFollowing = async(req,res)=>{
   try{
     const following = await Follow.find({userId:req.user._id}).select('friendId')
     res.send(following)
   }
   catch(e){
     res.send([])
   }
 }

 module.exports.getMyFollowingAuth = async(req,res)=>{
  try{
    let pageNumber = parseInt(req.body.pageNumber)|| 0
    const user = req.user._id
    const following = await Follow.find({userId:user}).populate('friendId','image full_name').lean().skip(pageNumber*10).limit(10)
    if(req.user){
      for(let i =0;i<following.length;i++){
      const friendId=  following[i].friendId._id
      const followingS = await Follow.exists({ userId: req.user._id, friendId: friendId });
    const followerS = await Follow.exists({ friendId: req.user._id, userId: friendId });
    following[i].friendId.following=followingS?true:false
    following[i].friendId.follower=followerS?true:false
      }
    }
    const totalFollowers = await Follow.countDocuments({userId:user})
    res.send({status:'success',following,totalFollowers})
  }
  catch(e){
    res.send({status:'fail',followers:0,totalFollowers:0})
  }
}
module.exports.getMyFollowersAuth = async(req,res)=>{
  try{
    let pageNumber = parseInt(req.body.pageNumber)|| 0
    const followers = await Follow.find({friendId:req.user._id}).populate('userId','image full_name').lean().skip(pageNumber).limit(10)
    if(req.user){
      for(let i =0;i<followers.length;i++){
      const friendId=  followers[i].userId._id
      const followingS = await Follow.exists({ userId: req.user._id, friendId: friendId });
    const followerS = await Follow.exists({ friendId: req.user._id, userId: friendId });
    followers[i].userId.following=followingS?true:false
    followers[i].userId.follower=followerS?true:false
      }
    }
    const totalFollowers = await Follow.countDocuments({friendId:req.body.user})
    res.send({status:'success',followers,totalFollowers})
  }
  catch(e){
    res.send({status:'fail',followers:0,totalFollowers:0})
  }
}
 module.exports.getUsers =async(req,res) =>{
  try{
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    
    // Filter based on userId and friendId only
    let filter = {
      $or: [
        { userId: new mongoose.Types.ObjectId(req.user._id) },
        { friendId: new mongoose.Types.ObjectId(req.user._id) }
      ]
    };
    
    if (search) {
      filter.$or.push({ 'user.full_name': { $regex: search, $options: 'i' } });
      filter.$or.push({ 'friend.full_name': { $regex: search, $options: 'i' } });
    }
    
    const users = await Follow.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friendId',
          foreignField: '_id',
          as: 'friend',
        },
      },
      {
        $unwind: "$user"
      },
      {
        $unwind: "$friend"
      },
      {
        $match: filter // Applying the filter conditions
      },
      {
        $limit: limit
      }
    ]);
    
    res.send(users);
  }
  catch(e){
 console.log(e)
 res.send([])
  }
 }