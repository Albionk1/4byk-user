const Message = require('../models/messageModel')
const { filterObj, validMongoId ,getUser} = require('../utils')
const mongoose = require('mongoose')



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
    res.send(send)
   }
   catch(e){
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
     const message= await  Message.aggregate([
         // Match messages that meet your criteria
         {
           $match: {
             status: "delivered",
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
             createdAt: 1,
             username: { $arrayElemAt: ["$user.username", 0] },
             image: { $arrayElemAt: ["$user.image", 0] }
           }
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