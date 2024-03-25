const express = require('express');
const followController = require('../../controllers/mobileControler/followControllerMobile')
const { requireAuthMobile, authRole } = require('../../middlewares/mobileAuthMiddleware')
const path = require('path');
const multer = require('multer')
const rateLimit = require("express-rate-limit");
const routeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
      errors:{id:'Keni bërë shumë kërkesa ju lutem provoni më vonë'}
    }
  });
    
 
const router = express.Router();
  

//follow routes
//ky route eshte per mja bo ose mja hek follow 1 user vetem e dergon ?friendId=id
router.post('/follow',requireAuthMobile,followController.follow)
//ky route eshte per me morr statusin e followit me 1 user ne qofse e ke ose te ka follow ai ty vetem e dergoj ?friendId=id e usert qe don me shiku statusin ne rast se respond eshte followingStatus:true dmth qe ti e ke follow at person ne qoftese ,followerStatus:true dmth qe ai person te ka ty follow 
router.get('/get-follow-status',requireAuthMobile,followController.getFollowStatus)
//ky route eshte per mi marr personat qe i ke follow  ky eshte me pagination ti kthen vetem 10 persona dhe, page duhet ?pageNumber=0 duke e rritur per 1
router.get('/get-my-following',requireAuthMobile,followController.getMyFollowing)
//ky route eshte per mi marr personat qe te kan follow  ky eshte me pagination ti kthen vetem 10 persona dhe, page duhet ?pageNumber=0 duke e rritur per 1
router.get('/get-my-followers',requireAuthMobile,followController.getMyFollowers)
// ky route ti kthen te gjith personat qe i ke follow por vetem id e user te tyre ne friendId
router.get('/get-all-my-following',requireAuthMobile,followController.getAllMyFollowing)
//
router.get('/get-users',requireAuthMobile,followController.getUsers)
module.exports=router