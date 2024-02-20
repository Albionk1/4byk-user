const express = require('express');
const messageController = require('../controllers/messageController')
const { requireAuth, authRole, checkUser, checkLogin } = require('../middlewares/authMiddleware')

const router = express.Router();



router.post('/send-message',requireAuth,messageController.sendMessage)
router.post('/get-message',requireAuth,messageController.getMessage)
router.post('/get-message-notification',requireAuth,messageController.getMessageNotification)
router.post('/get-message-notification-count',requireAuth,messageController.getMessageNotificationCount)
router.post('/get-latest-message',requireAuth,messageController.getLatestMessage)







module.exports = router;