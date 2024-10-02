const Student = require('../model/user.model');
const bcrypt = require("bcryptjs")
const nodemailer = require('nodemailer');
require("dotenv").config()
secret = process.env.SECRET

const jwt = require("jsonwebtoken")

const generateUniqueNumber = () => {
    const currentYear = new Date().getFullYear().toString();
    const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const randomAlphabets = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const matricNumber = currentYear + randomNumber + randomAlphabets;
    return matricNumber;
}





const userRegister = (req, res) => {
    const matricNumber = generateUniqueNumber();
    const otp = generateOTP()
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    const student = new Student({ ...req.body, matricNumber, otp, otpExpiration })
    const { email } = req.body;
    student.save()
        .then(() => {
            console.log("User saved successfully");
            sendUniqueNumberToEmail(email, matricNumber);
            res.status(201).send({ message: "User registered successfully", status: 200 });
        })
        .catch((error) => {
            console.error("Error saving user:", error);
            res.status(500).json({ message: "Internal Server Error" });
        });
};



const sendUniqueNumberToEmail = (email, matricNumber) => {
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
            subject: 'Edufy Student Matric Number',
            text: `Your Student Matric Number is : ${matricNumber}`
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


const userLogin = (req, res) => {
    let { matricNumber, password } = req.body;
    matricNumber = matricNumber.toUpperCase();
    Student.findOne({ matricNumber })
        .then((student) => {
            console.log(student)
            if (!student) {
                console.log("User not found");
                return res.status(404).json({ message: "User not found" });
            }

            bcrypt.compare(password, student.password, (err, match) => {
                if (err) {
                    console.log("Error comparing passwords:", err);
                    return res.status(500).json({ message: "Internal Server Error" });
                }

                if (!match) {
                    console.log("Incorrect password");
                    return res.status(401).send({ message: "Incorrect password" });
                } else {
                    const token = jwt.sign({ matricNumber }, secret, { expiresIn: '1h' });
                    console.log("User signed in successfully");
                    res.send({ message: "User signed in successfully", status: true, user: student, token: token });
                }
            });
        })
        .catch((error) => {
            console.error("Error finding user:", error);
            res.status(500).json({ message: "Internal Server Error" });
        });
};


const verifyToken = (req, res) => {
    const { token } = req.body;
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
        } else {
            console.log(decoded);
            console.log('Token verified successfully');
            res.send({ message: "Token verified successfully", status: true, decoded: decoded, valid: true, token: token });
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
            subject: 'Learnify forgotten password OTP',
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


    Student.findOneAndUpdate(
        { email },
        { otp, otpExpiration: expirationTime },
        { new: true, upsert: true }
    )
        .then((user) => {
            if (user) {
                sendOTPToEmail(email, otp)
                    .then(() => {
                        res.status(200).send({ message: 'OTP sent to email', status: true, otp: otp });
                    })
                    .catch((error) => {
                        res.status(500).json({ error: 'Failed to send OTP to email' });
                    });
            } else {
                console.log("user not found");
            }
        })
        .catch((err) => {
            res.status(500).json({ error: 'Database error' });
        });
}




const verifyOTP = (req, res) => {
    const { otp } = req.body;

    Student.findOne({ otp })
        .then((user) => {
            console.log(user);
            if (user.otp == otp) {

                res.status(200).json({ message: 'OTP verified successfully', status: true });
            } else {
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
        Student.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        )
            .then((user) => {
                if (!user) {
                    return res.status(404).send({ message: "User not found", status: false });
                }

                res.status(200).json({ message: "Password updated successfully", status: true });
            })
            .catch((error) => {
                console.error("Error updating password:", error);
                res.status(500).json({ message: "Internal Server Error" });
            });
    });
};


const userDashboard = (req, res) => {
    let upcomingClasses = [
        {
            Course: "Software Engineering",
            Instructor: "Dr. Smith",
            Date: "2024-03-10",
            Time: "10:00 AM - 12:00 PM",
            Location: "Room 301"
        },
        {
            Course: "Database Systems",
            Instructor: "Prof. Johnson",
            Date: "2024-03-12",
            Time: "2:00 PM - 4:00 PM",
            Location: "Room 302"
        },
        {
            Course: "Web Development",
            Instructor: "Dr. Patel",
            Date: "2024-03-15",
            Time: "9:00 AM - 11:00 AM",
            Location: "Room 303"
        },
        {
            Course: "Algorithms",
            Instructor: "Dr. Brown",
            Date: "2024-03-18",
            Time: "1:00 PM - 3:00 PM",
            Location: "Room 304"
        }
]
res.status(200).json({ message: "User Dashboard", upcomingClasses, });
}



module.exports = { userRegister, userLogin, verifyToken, forgotten, verifyOTP, createNewPassword, userDashboard };
