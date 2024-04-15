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
router.delete('/delete-account',upload.none(),authController.deleteAccount)
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
router.post('/get-my-following',upload.none(),authController.getMyFollowing)
router.post('/get-my-followers',upload.none(),authController.getMyFollowers)
router.post('/get-my-following-auth',requireAuth,upload.none(),authController.getMyFollowingAuth)
router.post('/get-my-followers-auth',requireAuth,upload.none(),authController.getMyFollowersAuth)
router.post('/get-all-my-following',authController.getAllMyFollowing)
router.post('/get-users-for-message',authController.getUsersForMessage)
//statistic route
router.get('/get-user-by-location',requireAuth,authController.getUserByLocation)
router.post('/get-users-search-header',upload.none(),authController.getUserSearchHeader)
//subscribe routes
router.post('/add-subscribe',upload.none(),authController.addSubscribe)


//auth api
router.post('/login-or-create-google',authController.loginOrCreateGoogle)
router.post('/login-or-create-facebook',authController.loginOrCreateFacebook)
//forget password
router.post('/sendForgotPasswordEmail',upload.none(),routeLimiter, authController.sendForgotPasswordEmail)
router.patch('/updateForgotedPassword',upload.none(),authController.updateForgotedPassword)
// rate user
router.post('/rate-user',upload.none(),requireAuth,authController.rateUser)

//logout
router.get('/logout',authController.logout)

module.exports=router