const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const {userRegister, userLogin, verifyToken, forgotten, verifyOTP, createNewPassword, userDashboard} = require('../controller/user.controller')


router.post('/user/register', userRegister)
router.post('/user/login', userLogin)
router.post('/user/verifyToken', verifyToken)
router.post('/user/forgot', forgotten)
router.post('/user/verifyotp', verifyOTP)
router.post('/user/createnewpassword', createNewPassword)
router.get('/user/dashboard', authenticate, userDashboard)

module.exports = router 