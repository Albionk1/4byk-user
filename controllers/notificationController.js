const Notification = require('../models/notificationModel')
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
    const {by,to,message,from,status,url} = req.body
      const notification = await Notification.create({by,to,message,from,status,url})
      const user = await User.findById(by).select('full_name')
      req.sendSocketMessage('notification', {user:{name:user.full_name,id:user._id},message,from,url})
      res.send({status:'success',message:'Notification sent'})
      
  }
  catch(e){
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
     const {id,page}=req.params
    const notifications = await Notification.find({to:id}).skip(parseInt(page)*5).limit(5)
    res.send(notifications)
  }
  catch(e){
    res.send({status:'fail',message:'Something went wrong'})
  }
}

module.exports.getNotificationsCount=async(req,res)=>{
  try{
    const notifications = await Notification.countDocuments({to:req.user._id})
    res.send({status:success,admin_notifications_count})
  }
  catch(e){
    res.send({status:'fail',admin_notifications_count:0})
  }
}

module.exports.markAllNotificationsToRead=async(req,res)=>{
  try{
    const notifications = await Notification.updateMany({to:req.user._id,status:'seen'},{status:'delivered'})
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
