const Message = require('../../models/messageModel')
const { filterObj, validMongoId ,getUser} = require('../../utils')
const mongoose = require('mongoose')
const Follow = require('../../models/followModel')
const User = require('../../models/userModel')
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
      const {to,message} =req.body
      const obj={by:req.user._id,to,message}
      const user=getUser(to.toString())
      if (user) {
         if(user.room==[to, req.user._id].join('')){
            obj.status='seen'
         }
       }
    const send = await Message.create(obj)
    res.send({status:'success',send})
   }
   catch(e){
    console.log(e)
      const errors = handleErrors(e)
      res.send({status:'fail',errors})
   }
 }
 module.exports.sendOffert=async(req,res)=>{
  try{
     const {to,message,offert_ref,title,image,price} =req.body
     let by = req.user._id
     const obj={by,to,message,offert_ref,title,image,price,offert:true}
     const user=getUser(to.toString())
     if (user) {
        if(user.room==[to, by].join('')){
           obj.status='seen'
        }
      }
   const send = await Message.create(obj)
   res.send({status:'success',send})
  }
  catch(e){
   console.log(e)
     const errors = handleErrors(e)
     res.send({status:'fail',errors})
  }
}
 module.exports.getMessage=async(req,res)=>{
   try{
      const {to} =req.query
      var page=req.query.page
      if(!page){
         page=0
      }
      const limit=20
      const skip = page  * limit;
    const send = await Message.find({  $or: [ { by:req.user._id,to  }, { by: to,to:req.user._id  } ] }).skip(skip).limit(limit).sort({createdAt:-1})
    const ids=[]
    for(var i =0;i<send.length;i++){
        ids.push(send[i]._id)
    }
    if(page==0){
    await Message.updateMany({ by: to,to:req.user._id  },{$set: { status: 'seen' } })
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
       res.send({status:'success',messages})
   }
   catch(e){
      const errors = handleErrors(e)
      res.send({status:'fail',errors})
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
    const message = await Message.aggregate([
      {
        $match: {
          $or:[
            {
          to: new mongoose.Types.ObjectId(req.user._id),
            },{
          by: new mongoose.Types.ObjectId(req.user._id),
            }
          ]
        }
      }, 
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $group: {
          _id: "$by",
          message: { $first: "$message" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          by: { $first: "$by" }, 
          to: { $first: "$to" } 
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
        $project: {
          _id: 1,
          message: 1,
          status: 1,
          by: 1,
          to: 1,
          createdAt: 1,
          full_name: { $arrayElemAt: ["$user.full_name", 0] },
          image: { $arrayElemAt: ["$user.image", 0] }
        }
      }
    ]);
    res.send(message)
  }
  catch(e){
    const errors = handleErrors(e)
    res.send({status:'fail',errors})
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
module.exports.getFriendsForMessage=async(req,res)=>{
  try{
    const user = req.user._id
    const followers = await Follow.find({ friendId: user }).select('userId');
const following = await Follow.find({ userId: user }).select('friendId');
const followersIds = followers.map(follower => follower.userId.toString());
const followingIds = following.map(follow => follow.friendId.toString());
const mutualFriendsIds = followersIds.filter(id => followingIds.includes(id) && id !== user);
const mutualFriends = await User.find({ _id: { $in: mutualFriendsIds } }).select('_id full_name image').lean()
const message = await Message.aggregate([
  {
    $match: {
      $or:[
        {
          to: { $in: mutualFriendsIds },
          // by: new mongoose.Types.ObjectId(req.user._id)
        },
        {
          by: { $in: mutualFriendsIds },
          // to: new mongoose.Types.ObjectId(req.user._id)
        }
      ]
    }
  }, 
  {
    $sort: {
      createdAt: -1
    }
  },
  {
    $group: {
      _id: "$by",
      message: { $first: "$message" },
      status: { $first: "$status" },
      createdAt: { $first: "$createdAt" },
      by: { $first: "$by" }, 
      to: { $first: "$to" } 
    }
  },
  {
    $project: {
      _id: 1,
      message: 1,
      status: 1,
      by: 1,
      to: 1,
      createdAt: 1,
    }
  }
]);
for(let i=0;i<message.length;i++){
  for(let a =0;a<mutualFriends.length;a++){
    if(message[i]._id.toString()===mutualFriends[a]._id.toString()){
      mutualFriends[a].message=message[i].message
      mutualFriends[a].createdAt=message[i].createdAt
      mutualFriends[a].status=message[i].status
    }
  }
}
res.send({status:'success',data:mutualFriends})
  }
  catch(e){
    res.send({status:'fail',data:[]})
  }
 }
 module.exports.getOffertsForMessage=async(req,res)=>{
  try{
    const user = req.user._id
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
]}).select('_id full_name image').lean()
const message = await Message.aggregate([
  {
    $match: {
      $or:[
        {
          to: { $in: mutualFriendsIds },
          by: new mongoose.Types.ObjectId(req.user._id)
        },
        {
          by: { $in: mutualFriendsIds },
          to: new mongoose.Types.ObjectId(req.user._id)
        }
      ]
    }
  }, 
  {
    $sort: {
      createdAt: -1
    }
  },
  {
    $group: {
      _id: "$by",
      message: { $first: "$message" },
      status: { $first: "$status" },
      createdAt: { $first: "$createdAt" },
      by: { $first: "$by" }, 
      to: { $first: "$to" } 
    }
  },
  {
    $project: {
      _id: 1,
      message: 1,
      status: 1,
      by: 1,
      to: 1,
      createdAt: 1,
    }
  }
]);
for(let i=0;i<message.length;i++){
  for(let a =0;a<mutualFriends.length;a++){
    if(message[i]._id.toString()===mutualFriends[a]._id.toString()){
      mutualFriends[a].message=message[i].message
      mutualFriends[a].createdAt=message[i].createdAt
      mutualFriends[a].status=message[i].status
    }
  }
}
res.send({status:'success',data:mutualFriends})
  }
  catch(e){
    console.log(e)
    res.send({status:'fail',data:[]})
  }
 }

 module.exports.getNonFriendForMessage = async(req,res)=>{
  try{
    const user = req.user._id
    const userForMessage = req.query.user
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
const mutualFriends = await User.find({ _id: { $in: mutualFriendsIds } }).select('_id full_name image').lean()
const message = await Message.aggregate([
  {
    $match: {
      $or:[
        {
          to: { $in: mutualFriendsIds },
          by: new mongoose.Types.ObjectId(req.user._id)
        },
        {
          by: { $in: mutualFriendsIds },
          to: new mongoose.Types.ObjectId(req.user._id)
        }
      ]
    }
  }, 
  {
    $sort: {
      createdAt: -1
    }
  },
  {
    $group: {
      _id: "$by",
      message: { $first: "$message" },
      status: { $first: "$status" },
      createdAt: { $first: "$createdAt" },
      by: { $first: "$by" }, 
      to: { $first: "$to" } 
    }
  },
  {
    $project: {
      _id: 1,
      message: 1,
      status: 1,
      by: 1,
      to: 1,
      createdAt: 1,
    }
  }
]);
for(let i=0;i<message.length;i++){
  for(let a =0;a<mutualFriends.length;a++){
    if(message[i]._id.toString()===mutualFriends[a]._id.toString()){
      mutualFriends[a].message=message[i].message
      mutualFriends[a].createdAt=message[i].createdAt
      mutualFriends[a].status=message[i].status
    }
  }
}
res.send({status:'success',data:mutualFriends})
  }
  catch(e){
    res.send({status:'fail',data:[]})
  }
}