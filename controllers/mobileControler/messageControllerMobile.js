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
      const {to,date} =req.query
      const limit=15
      let filter ={ $or: [ { by:req.user._id,to  }, { by: to,to:req.user._id  } ]}
      if(date){
        filter.updatedAt ={$lte:date}
      }
    const send = await Message.find(filter).limit(limit).sort({createdAt:-1})
    const ids=[]
    for(let i =0;i<send.length;i++){
        ids.push(send[i]._id)
    }
    await Message.updateMany({_id:{$in:ids},status:'delivered'},{$set: { status: 'seen' } })
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
// const mutualFriends = await User.find({ _id: { $in: mutualFriendsIds } }).select('_id full_name image').lean()
let friends=[]
const mutualFriendsIdsObjectIds = mutualFriendsIds.map(id => new mongoose.Types.ObjectId(id));
let filter = {
  $or:[
    {
      by: new mongoose.Types.ObjectId(req.user._id),
      to: { $in: mutualFriendsIdsObjectIds }
    },
    {
      by: { $in: mutualFriendsIdsObjectIds },
      to: new mongoose.Types.ObjectId(req.user._id)
    }
  ]
}
if(req.query.date){
  filter.updatedAt={ $lte: req.query.date }
}
const message = await Message.aggregate([
  {
    $match: filter
  },
  {
    $group: {
      _id: { $cond: [{ $eq: ["$by", new mongoose.Types.ObjectId(req.user._id)] }, "$to", "$by"] }, // Group by the recipient's or sender's ID
      message: { $last: "$message" },
      status: { $last: "$status" },
      createdAt: { $last: "$createdAt" },
      updatedAt: { $last: "$updatedAt" },
      by: { $last: "$by" },
      to: { $last: "$to" }
    }
  },
  {
    $sort: {
      createdAt: -1
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
    $unwind: {
      path: "$user",
      preserveNullAndEmptyArrays: true
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
      updatedAt: 1,
      full_name: { $ifNull: ["$user.full_name", "Unknown"] },
      image: { $ifNull: ["$user.image", "default_image_url"] }
    }
  },
  {
    $limit: 15
  }
])
// console.log(message)
for(let i=0;i<message.length;i++){
  for(let a =0;a<mutualFriendsIds.length;a++){
    if(message[i]._id.toString()===mutualFriendsIds[a].toString()){
      friends.push(message[i])
    }
  }
}
res.send({status:'success',data:friends})
  }
  catch(e){
    res.send({status:'fail',data:[]})
  }
 }
 module.exports.getOffertsForMessage=async(req,res)=>{
  try{
    const user = req.user._id
const mutualFriendsIds = []
let filter = {
  $or: [
     { by: new mongoose.Types.ObjectId(user),offert:true } , // User writes an offer
     { to: new mongoose.Types.ObjectId(user),offert:true }   // User receives an offer
  ]
}
if(req.query.date){
  filter.updatedAt={ $lte: req.query.date }
}
const messages = await Message.aggregate([
  {
    $match: filter
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
    $limit: 15
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
const message = await Message.aggregate([
  {
    $match: {
      $or:[
        {
       $and: [
            { to: { $in: mutualFriendsIds } },
            { to: { $ne: user } } 
          ],
          by: new mongoose.Types.ObjectId(req.user._id)
        },
        {
          $and: [
            { by: { $in: mutualFriendsIds } },
            { by: { $ne: user } } 
          ],
          to: new mongoose.Types.ObjectId(req.user._id)
        }
      ]
    }
  }, 
  {
    $group: {
      _id: "$by",
      message: { $last: "$message" },
      status: { $last: "$status" },
      createdAt: { $last: "$createdAt" },
      updatedAt: { $last: "$updatedAt" },
      by: { $first: "$by" }, 
      to: { $first: "$to" } 
    }
  },
  {
    $sort: {
      updatedAt: -1
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
      updatedAt: 1,
      full_name: { $arrayElemAt: ["$user.full_name", 0] },
      image: { $arrayElemAt: ["$user.image", 0] }
    }
  }
]);
// for(let i=0;i<message.length;i++){
//   for(let a =0;a<mutualFriends.length;a++){
//     if(message[i]._id.toString()===mutualFriends[a]._id.toString()){
//       mutualFriends[a].message=message[i].message
//       mutualFriends[a].createdAt=message[i].createdAt
//       mutualFriends[a].status=message[i].status
//     }
//   }
// }
res.send({status:'success',data:message})
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
let nonFriends =[]
const mutualFriendsIds = followersIds.filter(id => followingIds.includes(id));
const mutualFriendsIdsObjectIds = mutualFriendsIds.map(id => new mongoose.Types.ObjectId(id));
let filter = {
  $or: [
     { by: new mongoose.Types.ObjectId(user),offert:false,to:{$nin:mutualFriendsIdsObjectIds} } ,
     { to: new mongoose.Types.ObjectId(user),offert:false,by:{$nin:mutualFriendsIdsObjectIds} }   
  ]
}
if(req.query.date){
  filter.updatedAt={ $lte: req.query.date }
}
const messages = await Message.aggregate([
  {
    $match: filter
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
    $sort: {
      updatedAt: -1
    }
  },
  {
    $limit: 15
  },
  {
    $project: {
      _id: 0,
      users: ["$_id.by", "$_id.to"]
    }
  }
]);
messages.forEach(message => {
if(message.users[0].toString()!==req.user._id.toString())nonFriends.push(message.users[0].toString())
if(message.users[1].toString()!==req.user._id.toString())nonFriends.push(message.users[1].toString())
});

const nonmutualFriendsIdsObjectIds = nonFriends.map(id => new mongoose.Types.ObjectId(id));
let filter1 ={
      $or:[
        // {
        //   to: { $in: nonmutualFriendsIdsObjectIds },
        //   by: new mongoose.Types.ObjectId(req.user._id)
        // },
        {
          by: { $in: nonmutualFriendsIdsObjectIds },
          to: new mongoose.Types.ObjectId(req.user._id)
        }
      ]
    }
    const message = await Message.aggregate([
      {
        $match: filter1
      },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$by", new mongoose.Types.ObjectId(req.user._id)] }, "$to", "$by"] }, // Group by the recipient's or sender's ID
          message: { $last: "$message" },
          status: { $last: "$status" },
          createdAt: { $last: "$createdAt" },
          updatedAt: { $last: "$updatedAt" },
          by: { $last: "$by" },
          to: { $last: "$to" }
        }
      },
      {
        $sort: {
          createdAt: -1
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
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
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
          updatedAt: 1,
          full_name: { $ifNull: ["$user.full_name", "Unknown"] },
          image: { $ifNull: ["$user.image", "default_image_url"] }
        }
      },
      {
        $limit: 15
      }
    ])
if(userForMessage){
  const user = await User.findById(userForMessage).select('full_name image')
  message.push(user)
}
res.send({status:'success',data:message})
  }
  catch(e){
    res.send({status:'fail',data:[]})
  }
}