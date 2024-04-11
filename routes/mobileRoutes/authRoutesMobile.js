const express = require('express');
const authController = require('../../controllers/mobileControler/authControllerMobile')
const { requireAuthMobile, authRole } = require('../../middlewares/mobileAuthMiddleware')
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
         file.mimetype === 'image/webp' ||
         file.mimetype === 'application/octet-stream'
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
  const router = express.Router();
  
router.post('/login',authController.login)
router.post('/add-user',upload.single('image'),authController.addUser)
router.post('/get-user-id',authController.getUserById)
router.post('/edit-profile-pic',upload.single('image'),requireAuthMobile,authController.editProfilePic)
router.post('/edit-profile-cover',upload.single('cover'),requireAuthMobile,authController.editProfileCover)
router.post('/edit-name',requireAuthMobile,authController.editName)
router.post('/edit-bio',requireAuthMobile,authController.editBio)
router.post('/get-users-for-message',requireAuthMobile,authController.getUsersForMessage)
router.get('/search-users',authController.searchUsers)
router.delete('/delete-account',authController.deleteAccount)
router.post('/sendForgotPasswordEmail',routeLimiter, authController.sendForgotPasswordEmail)

module.exports=router