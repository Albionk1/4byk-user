const Notification = require('../../models/notificationModel')
const User = require('../../models/userModel')
const { filterObj, validMongoId ,getUser} = require('../../utils')
const mongoose = require('mongoose')
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

 module.exports.addNotification = async(req,res)=>{
  try{
    const {to,message,from,url} = req.body
      const notification = await Notification.create({by:req.user._id,to,message,from,url})
      req.sendSocketMessage('notification', {user:{name:req.user.full_name,id:req.user._id},message,from,url,date:notification.createdAt},to)
      res.send({status:'success',message:'Notification sent'})
      
  }
  catch(e){
    console.log(e)
    res.send({status:'fail',message:'Something went wrong'})

  }
}

module.exports.deleteAllNotification = async(req,res)=>{
  try{
    const notifications = await Notification.deleteMany({to:req.user._id})
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
     let reels
     let notificationIds = []
    const notifications = await Notification.find({to:req.user._id}).sort({createdAt:-1}).skip(skipIndex).limit(5).lean().populate('by','full_name image')
    const reelIds=[]
    for(let i =0;i<notifications.length;i++){
      userId.push(notifications[i].by)
      if(notifications[i].url&&notifications[i].url.includes('reels-single')){
        notifications[i].reel_id=notifications[i].url.split('/')[2]
      }
      if(notifications[i].from==='like'||notifications[i].from==='comment'){
        reelIds.push(notifications[i].url.split('/')[2])
      }
      notificationIds.push(notifications[i]._id)
    }
    if (process.env.NODE_ENV === 'development') {
      const responseLike = await axios.get('http://localhost:3002/get-reels-image?reelIds=' + reelIds.join(','));
      reels = responseLike.data;
  }
   else {
      const responseLike = await axios.get('https://four-buyk-post-f28d12848a02.herokuapp.com/get-reels-image?reelIds=' + reelIds.join(','));
      reels = responseLike.data;
  }
  for (let i =0 ;i<reels.length;i++){
    for(let a =0;a<notifications.length;a++){
      if(notifications[a].from==='like'||notifications[a].from==='comment' && reels[i]._id.toString()===notifications[a].reel_id){
        notifications[a].reel_thumbnail =  reels[i].thumbnail
      }
    }
  }
    const hasMore = (skipIndex + limit) < await Notification.countDocuments({
      to:req.user._id
    });
    await Notification.updateMany({_id:{$in:notificationIds}},{status:'seen'})
    res.send({
      status: 'success',
      data: {
        notifications,
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
    res.send({status:'success',count:notifications})
  }
  catch(e){
    console.log(e)
    res.send({status:'fail',count:0})
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
