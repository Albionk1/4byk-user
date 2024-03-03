const express = require('express');
const authController = require('../controllers/authController')
const { requireAuth, authRole, checkUser, checkLogin,accessStaff } = require('../middlewares/authMiddleware')
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
  const router = express.Router();
router.post('/get-user-image-by-id',authController.getUserImageById)
router.post('/get-users-filter',authController.getUsersFilter)
router.post('/get-user-id',authController.getUserById)
router.post('/login',upload.none(),authController.login)
router.post('/add-user',upload.single('image'),authController.addUser)
router.post('/edit-user',upload.single('image'),requireAuth,authController.updateUser)
router.post('/edit-profile-pic',upload.single('image'),requireAuth,authController.editProfilePic)
router.patch('/delete-user',upload.none(),requireAuth,accessStaff('u-list'),authController.deleteUser)

//admin
router.post('/add-admin',upload.single('image'),authController.addAdmin)
router.get('/get-admin-list',authController.getAdminList)
router.post('/edit-admin',upload.single('image'),authController.editAdmin)
router.patch('/delete-admin',upload.none(),authController.deleteAdmin)
//user tabke
router.get('/get-user-individ-table',requireAuth,authController.getUserIndividTable)
router.get('/get-user-business-table',requireAuth,authController.getUserBusinessTable)

//follow routes
router.post('/follow',requireAuth,upload.none(),authController.follow)
router.post('/get-follow-status',authController.getFollowStatus)
router.post('/get-my-following',authController.getMyFollowing)
router.post('/get-my-followers',authController.getMyFollowers)
router.post('/get-all-my-following',authController.getAllMyFollowing)
//notification 
router.post('/add-notification',authController.addNotification)
router.delete('/delete-all-notification',authController.deleteAllNotification)
router.get('/get-notifications',requireAuth,authController.getNotifications)

//logout
router.get('/logout',authController.logout)

module.exports=router