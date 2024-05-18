const Notification = require('../models/notificationModel')
const User = require('../models/userModel')
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

 module.exports.addNotification = async(req,res)=>{
  try{
    const {by,to,message,n_type,status,url,payload} = req.body
      const notification = await Notification.create({by,to,message,n_type,status,url,payload})
      const user = await User.findById(by).select('full_name image')
      req.sendSocketMessage('notification', {user:{full_name:user.full_name,id:user._id,image:user.image},message,n_type,url,date:notification.createdAt,payload},to)
      res.send({status:'success',message:'Notification sent'})
      
  }
  catch(e){
    console.log(e)
    res.send({status:'fail',message:'Something went wrong'})

  }
}
module.exports.addActivityMultiple = async(req,res)=>{
  try{
    const {by,to,message,n_type,status,url,payload} = req.body
    let notifications=[]
    for(let i=0;i<to.length;i++){
 notifications.push({by,to:to[i],message,n_type,status,url,payload})
    }
      const notification = await Notification.create(notifications)
      // const user = await User.findById(by).select('full_name image')
      // req.sendSocketMessage('notification', {user:{full_name:user.full_name,id:user._id,image:user.image},message,n_type,url,date:notification.createdAt,payload},to)
      res.send({status:'success',message:'Notification sent'})
      
  }
  catch(e){
    console.log(e)
    res.send({status:'fail',message:'Something went wrong'})

  }
}

module.exports.deleteAllNotification = async(req,res)=>{
  try{
    const {id} = req.body
    const notifications = await Notification.deleteMany({to:id})
      res.send({status:'success',message:'Deleted all notifications'})
  }
  catch(e){
    res.send({status:'fail',message:'Something went wrong'})
  }
}

module.exports.getNotifications=async(req,res)=>{
  try{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skipIndex = (page - 1) * limit;
     let userId =[]
     let notificationIds = []
    const notifications = await Notification.find({to:req.user._id,status:'delivered'}).skip(skipIndex).limit(5).lean().populate('by','full_name image')
    for(let i =0;i<notifications.length;i++){
      userId.push(notifications[i].by)
      notificationIds.push(notifications[i]._id)
    }
    const hasMore = (skipIndex + limit) < await Notification.countDocuments({
      to:req.user._id
    });
    await Notification.updateMany({_id:{$in:notificationIds}},{status:'seen'})
    res.send({
      status: 'success',
      data: {
        admin_notifications: notifications,
        hasMore
      },
    })
  }
  catch(e){
    console.log(e)
    res.send({status:'fail',message:'Something went wrong'})
  }
}

module.exports.getNotificationsCount=async(req,res)=>{
  try{
    const notifications = await Notification.countDocuments({to:req.user._id,status:'delivered'})
    res.send({status:'success',admin_notifications_count:notifications})
  }
  catch(e){
    console.log(e)
    res.send({status:'fail',admin_notifications_count:0})
  }
}

module.exports.markAllNotificationsToRead=async(req,res)=>{
  try{
    const notifications = await Notification.updateMany({to:req.user._id,status:'delivered'},{status:'seen'})
    res.send({
      status: 'success',
      message: 'Marked all as read',
    })
  }
  catch(e){
    res.status(400).send({
      status: 'fail',
      message: 'Bad Request',
    })
  }
}
