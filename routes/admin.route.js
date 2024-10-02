const express = require('express')
const adminRouter = express.Router()
const { adminRegister, adminLogin, verifyToken, forgotten, verifyOTP, createNewPassword, getAdminDetails } = require('../controller/admin.controller')


adminRouter.post('/admin/register', adminRegister)
adminRouter.post('/admin/login', adminLogin)
adminRouter.post('/admin/verifyToken', verifyToken)
adminRouter.post('/admin/forgot', forgotten)
adminRouter.post('/admin/verifyotp', verifyOTP)
adminRouter.post('/admin/createnewpassword', createNewPassword)
adminRouter.get('/admin/details/:adminId', getAdminDetails);

module.exports = adminRouter