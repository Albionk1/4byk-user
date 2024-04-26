const express = require('express');
const versionController = require('../../controllers/mobileControler/versionController')
const { requireAuthMobile, authRole } = require('../../middlewares/mobileAuthMiddleware')
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
//ky route eshte per ta mderruar versionin ne body dergoni { version:'versioni',os:"ios apo android"}
router.post('/change-verions',requireAuthMobile,versionController.changeVersion)
//ky route eshte per me morr versionin e fundit thjesht dergoni ?os=android ose ?os=ios
router.get('/get-version',versionController.getVersion)

module.exports=router