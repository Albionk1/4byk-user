const express = require('express');
const messageController = require('../../controllers/mobileControler/messageControllerMobile')
const { requireAuthMobile, authRole } = require('../../middlewares/mobileAuthMiddleware')


const router = express.Router();


const path = require('path');
const multer = require('multer')
const rateLimit = require("express-rate-limit");
const storage = multer.diskStorage({
 
    filename: function(req, file, cb) {
      let noWhiteSpaceOriginalName = file.originalname.split('.')[0].replace(/\s/g, '')
      cb(null, file.fieldname + '-' + noWhiteSpaceOriginalName + '-' + Date.now() + path.extname(file.originalname));
    }
  });
const routeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
      errors:{id:'Keni bërë shumë kërkesa ju lutem provoni më vonë'}
    }
  });
    
   const fileFilter = (req, file, cb) => {
     if (
         file.mimetype === 'image/jpeg' ||
         file.mimetype === 'image/jpg' ||
         file.mimetype === 'image/png' ||
         file.mimetype === 'image/webp'
     ) {
         cb(null, true)
     } else {
         cb(null, false)
         req.multerInvalidFileTypeErr = 'INVALID_FILE_TYPE'
     }
  }
    
    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: 5000000 },
    })
router.post('/send-message',requireAuthMobile,upload.none(),messageController.sendMessage)
router.post('/send-offert',requireAuthMobile,upload.none(),messageController.sendOffert)
router.get('/get-message',requireAuthMobile,messageController.getMessage)
router.get('/get-message-notification',requireAuthMobile,messageController.getMessageNotification)
router.get('/get-message-notification-count',requireAuthMobile,messageController.getMessageNotificationCount)
router.get('/get-latest-message',requireAuthMobile,messageController.getLatestMessage)







module.exports = router;