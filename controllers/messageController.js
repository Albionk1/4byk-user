const Message = require('../models/messageModel')
const User = require('../models/userModel')
const { filterObj, validMongoId ,getUser} = require('../utils')
const mongoose = require('mongoose')
const Follow = require('../models/followModel')
const axios = require('axios')


const handleErrors = (err) => {
  
   let errors = {}
   if(err.message ==="Invalid ID"){
      errors.id="Id nuk është valide"
     return errors
   }
   for (var key in err.errors) {
    if(err.errors[key]){
       errors[key]=err.errors[key].message
    }

 }
   return errors
 }

 module.exports.sendMessage=async(req,res)=>{
   try{
      const {by,to,message} =req.body
      const obj={by,to,message}
      const user=getUser(to.toString())
      if (user) {
         if(user.room==[to, by].join('')){
            obj.status='seen'
         }
       }
    const send = await Message.create(obj)
    res.send({status:'success',message:send})
   }
   catch(e){
    console.log(e)
      const errors = handleErrors(e)
      res.send({status:'fail',errors})
   }
 }
 module.exports.sendOffert=async(req,res)=>{
  try{
     const {to,message,offert_ref,title,image,price,productId} =req.body
     let data
     if (process.env.NODE_ENV === 'development') {
      const response = await axios.post('http://localhost:3002/make-offert', {user:req.user._id,product:productId })
      data = response.data;
    }
    else {
      const response = await axios.post('https://four-buyk-post-f28d12848a02.herokuapp.com/make-offert', { user:req.user._id,product:productId })
      data = response.data;
    }
    if(data.status==='success'){
      console.log('offert',data.offert)
      let by = req.user._id
      const obj={by,to,message,offert_ref,title,image,price,offert:true,offert_ref:data.offert}
      const user=getUser(to.toString())
      if (user) {
         if(user.room==[to, by].join('')){
            obj.status='seen'
         }
       }
    const send = await Message.create(obj)
  return res.send({status:'success',send})
    }
   res.send({status:'fail'})
  }
  catch(e){
   console.log(e)
     const errors = handleErrors(e)
     res.send({errors})
  }
}
 module.exports.getMessage=async(req,res)=>{
   try{
      const {by,to} =req.body
      var page=req.body.page
      if(!page){
         page=0
      }
      const limit=20
      const skip = page  * limit;
    const send = await Message.find({  $or: [ { by,to  }, { by: to,to:by  } ] }).skip(skip).limit(limit).sort({createdAt:-1})
    const ids=[]
    for(var i =0;i<send.length;i++){
        ids.push(send[i]._id)
    }
    if(page==0){
    await Message.updateMany({ by: to,to:by  },{$set: { status: 'seen' } })
   }
    res.send(send)
   }
   catch(e){
      const errors = handleErrors(e)
      res.send({errors})
   }
 }
 module.exports.getMessageNotification=async(req,res)=>{
   try{
    const messages = await Message.aggregate([
      {
          $match: {
              status:'delivered',
              to: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $sort: {
              createdAt: 1
          }
      },
      {
          $group: {
              _id: "$by",
              message: { $first: "$message" },
              createdAt: { $first: "$createdAt" }
          }
      },
      {
          $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user"
          }
      },
      {
          $unwind: "$user" // Unwind the array created by $lookup
      },
      {
          $project: {
              _id: 1,
              message: 1,
              createdAt: 1,
              full_name: "$user.full_name",
              image: "$user.image"
          }
      }
  ]);
       res.send(messages)
   }
   catch(e){
      const errors = handleErrors(e)
      res.send({errors})
   }
 }

 module.exports.getMessageNotificationCount=async(req,res)=>{
   try{
     const message=await Message.aggregate([
         // Match messages that meet your criteria
         {
           $match: {
             status: "delivered",
             to: new mongoose.Types.ObjectId(req.user._id), // replace with the ObjectId of the user you're querying for
           }
         },
         // Group messages by the "by" and "to" fields and create a set of unique values for each group
         {
           $group: {
             _id: { by: "$by", to: "$to" },
             uniqueValues: { $addToSet: "$by" }
           }
         },
         // Count the number of groups
         {
           $count: "count"
         }
       ]);
       res.send(message)
   }
   catch(e){
      console.log(e)
      const errors = handleErrors(e)
      res.send({errors})
   }
 }

 module.exports.getLatestMessage=async(req,res)=>{
  try{
  const message = await  Message.aggregate([
      // Match messages that meet your criteria
      {
        $match: {
          to: new mongoose.Types.ObjectId(req.user._id),
        }
      }, {
        $sort: {
          createdAt: -1
        }
      },
      // Group messages by the "by" field and keep only the first one for each group
      {
        $group: {
          _id: "$by",
          message: { $first: "$message" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" }
        }
      },
      // Sort the results by the "createdAt" field in descending order
     
      // Populate the "by" field with the corresponding user document
      {
        $lookup: {
          from: "users", // replace with the name of your users collection
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      // Project only the "username" and "image" fields from the user document
      {
        $project: {
          _id: 1,
          message: 1,
          status:1,
          createdAt: 1,
          username: { $arrayElemAt: ["$user.username", 0] },
          image: { $arrayElemAt: ["$user.image", 0] }
        }
      }
    ]);
    res.send(message)
  }
  catch(e){
    const errors = handleErrors(e)
    res.send({errors})
  }
 }

 module.exports.getFriendsForMessage=async(req,res)=>{
  try{
    const user = req.query.user
    const followers = await Follow.find({ friendId: user }).select('userId');
const following = await Follow.find({ userId: user }).select('friendId');
const followersIds = followers.map(follower => follower.userId.toString());
const followingIds = following.map(follow => follow.friendId.toString());
const mutualFriendsIds = followersIds.filter(id => followingIds.includes(id));
const mutualFriends = await User.find({ _id: { $in: mutualFriendsIds } }).select('_id full_name image')
res.send(mutualFriends)
  }
  catch(e){
    res.send([])
  }
 }
 module.exports.getOffertsForMessage=async(req,res)=>{
  try{
    const user = req.query.user
const mutualFriendsIds = []
const messages = await Message.aggregate([
  {
    $match: {
      $or: [
         { by: new mongoose.Types.ObjectId(user),offert:true } , // User writes an offer
         { to: new mongoose.Types.ObjectId(user),offert:true }   // User receives an offer
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
  mutualFriendsIds.push(message.users[0])
  mutualFriendsIds.push(message.users[1])
});
const mutualFriends = await User.find({$and: [
  { _id: { $in: mutualFriendsIds } },
  { _id: { $ne: user } } 
]}).select('_id full_name image')
res.send(mutualFriends)
  }
  catch(e){
    console.log(e)
    res.send([])
  }
 }

 module.exports.getNonFriendForMessage = async(req,res)=>{
  try{
    const user = req.query.user
    const userForMessage = req.query.userForMessage
    const followers = await Follow.find({ friendId: user }).select('userId');
const following = await Follow.find({ userId: user }).select('friendId userId');
const followersIds = followers.map(follower => follower.userId.toString());
const followingIds = following.map(follow => follow.friendId.toString());
const mutualFriendsIds = followersIds.filter(id => followingIds.includes(id));
const messages = await Message.aggregate([
  {
    $match: {
      $or: [
         { by: new mongoose.Types.ObjectId(user),offert:false } ,
         { to: new mongoose.Types.ObjectId(user),offert:false }   
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
  for(let i =0;i<mutualFriendsIds.length;i++){
    if(message.users[0].toString() ===mutualFriendsIds[i].toString() )mutualFriendsIds.splice(i, 1)
    if(message.users[1].toString() ===mutualFriendsIds[i].toString() )mutualFriendsIds.splice(i, 1)
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
module.exports.rejectOffert=async(req,res)=>{
  try{
    const {message,offert}= req.body
    let data 
    if (process.env.NODE_ENV === 'development') {
      const response = await axios.post('http://localhost:3002/reject-offert', {offert})
      data = response.data;
    }
    else {
      const response = await axios.post('https://four-buyk-post-f28d12848a02.herokuapp.com/reject-offert', { offert})
      data = response.data;
    }
    const msg = await Message.findByIdAndUpdate(message,{offert_res:true})
    res.send({status:'success'})
  }
  catch(e){
    res.send({status:'fail'})

  }
}

module.exports.acceptOffert=async(req,res)=>{
  try{
    const {message,offert}= req.body
    let data 
    if (process.env.NODE_ENV === 'development') {
      const response = await axios.post('http://localhost:3002/accept-sell', {offertId:offert})
      data = response.data;
    }
    else {
      const response = await axios.post('https://four-buyk-post-f28d12848a02.herokuapp.com/accept-sell', { offertId:offert})
      data = response.data;
    }
    const msg = await Message.findByIdAndUpdate(message,{offert_res:true})
    res.send({status:'success'})

  }
  catch(e){
    res.send({status:'fail'})
  }
}