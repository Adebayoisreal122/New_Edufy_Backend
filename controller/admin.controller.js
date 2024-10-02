const admin = require('../model/admin.model')
const bcrypt = require("bcrypt")
const nodemailer = require('nodemailer');
require("dotenv").config()
secret = process.env.SECRET
const jwt = require("jsonwebtoken")

const generateadminId = () => {
    const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); 
    const adminId = 'admin' + randomNumber;
    return adminId;
}


const adminRegister = (req, res) => {
    let adminId = generateadminId();
    const otp = generateOTP();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    const staff = new admin({ ...req.body, adminId, otp, otpExpiration });

    const { email } = req.body;
    staff.save()
    .then((result) => {
        console.log("Admin info saved successfully");
        
        sendUniqueNumberToEmail(email, adminId)
        .then(() => {
            res.status(201).send({ message: "Admin registered successfully", status: 200 });
        })
        .catch((err) => {
            console.error("Failed to send email:", err);
            res.status(500).send({ message: "Admin registered, but failed to send email", status: 500 });
        });
    })
    .catch((err) => {
        console.error("Information not saved:", err);
        res.status(500).send({ message: "Admin registration failed", status: 500 });
    });
};

const sendUniqueNumberToEmail = (email, adminId) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'adebayooluwaferanmi112@gmail.com',
                pass: 'saxd eqqo ikek gelu' 
            }
        });

        const mailOptions = {
            from: 'adebayooluwaferanmi112@gmail.com',
            to: email,
            subject: 'Edufy Admin Unique ID',
            text: `Your Unique Admin ID is: ${adminId}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error occurred:', error);
                reject(error); // Reject the promise on error
            } else {
                console.log('Email sent successfully!');
                console.log('Message sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                resolve(info); // Resolve the promise on success
            }
        });
    });
};




// In your backend (user.controller.js)
const adminLogin = (req, res) => {
    const { adminId, password } = req.body;

    // Find admin by adminId
    admin.findOne({ adminId })
        .then(staff => {
            if (!staff) {
                return res.status(404).send({ message: "Admin not found", status: 404 });
            }

            // Check if the password is correct
            bcrypt.compare(password, staff.password, (err, isMatch) => {
                if (err) {
                    return res.status(500).send({ message: "Internal server error", status: 500 });
                }

                if (isMatch) {
                    // Generate a token if needed
                    const token = jwt.sign({ id: staff._id }, process.env.SECRET, { expiresIn: '1h' });

                    res.status(200).send({ message: "Login successful", status: 200, token, adminId: staff.adminId });
                } else {
                    res.status(401).send({ message: "Incorrect password", status: 401 });
                }
            });
        })
        .catch(err => {
            console.error("Error during login", err);
            res.status(500).send({ message: "Internal server error", status: 500 });
        });
};




const verifyToken = (req, res)=>{
    const { token } = req.body;
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err);
      } else {
        console.log(decoded);
        console.log('Token verified successfully');
        res.send({ message: "Token verified successfully", status: true, decoded: decoded, valid:true, token:token });
      }
    });
  }

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const sendOTPToEmail = (email, otp) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'adebayooluwaferanmi112@gmail.com',
                pass: 'saxd eqqo ikek gelu'
            }
        });

        const mailOptions = {
            from: 'adebayooluwaferanmi112@gmail.com',
            to: email,
            subject: 'Edufy forgotten pasword OTP',
            text: `Your one time password OTP is : ${otp}
This OTP is valid for 30 minutes. Please do not share this OTP with anyone.
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

const forgotten = (req, res) => {
    const { email } = req.body;
    const otp = generateOTP(); 
    const expirationTime = new Date(Date.now() + 30 * 60 * 1000); 
 

    admin.findOneAndUpdate(
        { email },
        { otp, otpExpiration: expirationTime }, 
        { new: true, upsert: true } 
    )
    .then((user) => {
        if(user){
            sendOTPToEmail(email, otp)
                .then(() => {
                    res.status(200).send({ message: 'OTP sent to email', status: true, otp: otp });
                })
                .catch((error) => {
                    res.status(500).json({ error: 'Failed to send OTP to email' });
                });
        }else{
            console.log("user not found");
        }
    })
    .catch((err) => {
        res.status(500).json({ error: 'Database error' });
    });
}




const getAdminDetails = (req, res) => {
    const { adminId } = req.params;

    admin.findOne({ adminId })
        .then(staff => {
            if (!staff) {
                return res.status(404).send({ message: "Admin not found", status: 404 });
            }

            res.status(200).send({ message: "Admin details fetched successfully", status: 200, data: staff });
        })
        .catch(err => {
            console.error("Error fetching admin details", err);
            res.status(500).send({ message: "Internal server error", status: 500 });
        });
};



const verifyOTP = (req, res) => {
    const { otp } = req.body;
    admin.findOne({ otp })
        .then((user) => {
            if(user.otp == otp && user.otpExpiration > new Date()){
                
                res.status(200).json({ message: 'OTP verified successfully', status: true });
            }else{
                res.status(400).json({ message: 'invalid OTP', status: false });
            }
            
        })
        .catch((error) => {
            res.status(500).json({ error: 'Database error' });
        });
}


const createNewPassword = (req, res) => {
    const { email, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: "Internal Server Error" });
        }
        admin.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        )
        .then((user) => {
            if (!user) {
                return res.status(404).send({ message: "User not found", status: false });
            }else{
                res.status(200).send({ message: "Password updated successfully", status: true });
            }
        })
        .catch((error) => {
            console.error("Error updating password:", error);
            res.status(500).json({ message: "Internal Server Error" });
        });
    });
};





module.exports = {adminRegister, adminLogin, verifyToken, forgotten, verifyOTP, createNewPassword, getAdminDetails }