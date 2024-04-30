const { addUser, removeUser, getUser, editRoom } = require('../utils')
const User =  require('../models/userModel')
const { initializeApp, sendMessage } = require('../controllers/fcm_notifications')
 const socketMiddleware = (io) => {
   return (req, res, next) => {
     req.sendSocketMessage = async(event, data,to) => {
      const user = getUser(to);
      if (user) {
          return io.to(to).emit(event, { data });
      }
      const userNotify = await User.findById(to).select('fcm_token')
      if(userNotify){
         data.type ='notification'
         data.n_payload=data.payload
         delete data.payload
         sendMessage(data.user.full_name,data,userNotify.fcm_token[userNotify.fcm_token.length-1]);  
      }
     };
     next();
   };
 };
 
 module.exports = socketMiddleware;