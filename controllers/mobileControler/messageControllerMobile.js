const Message = require('../../models/messageModel')
const { filterObj, validMongoId ,getUser} = require('../../utils')
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
          to: new mongoose.Types.ObjectId(req.user._id),
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