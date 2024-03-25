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

 module.exports.getUsers =async(req,res) =>{
  try{
    let length = parseInt(req.query.length) || 10
    const search = req.query.search
    let filter ={$or: [
      { userId: mongoose.Types.ObjectId(req.user._id) },
      { friendId: mongoose.Types.ObjectId(req.user._id) }
    ]}

    if(search){
      filter.userId.full_name
      filter.friendId.full_name
    }
    if(date){
      
    }
    const users = await Follow.aggregate([
      {
        $match: {
          
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "friendId",
          foreignField: "_id",
          as: "friend"
        }
      },
      {
        $project: {
          user: { $arrayElemAt: ["$user", 0] },
          friend: { $arrayElemAt: ["$friend", 0] }
        }
      },
      {
        $project: {
          "user._id": 1,
          "user.full_name": 1,
          "user.image": 1,
          "friend._id": 1,
          "friend.full_name": 1,
          "friend.image": 1
        }
      },
      {
        $match: {
          $or: [
            { "": { $regex: search, $options: 'i' } },
            { "friend.full_name": { $regex: search, $options: 'i' } }
          ]
        }
      },
      { $limit: length }
    ]);
    
    res.send(users)
  }
  catch(e){
 console.log(e)
 res.send([])
  }
 }