const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const URI = "mongodb+srv://Newedufy:Isrealight112@cluster2.uezjk2x.mongodb.net/Newedufy?retryWrites=true&w=majority&appName=Cluster2"



// console.log('Connecting to:', URI);

mongoose.connect(URI)
  .then((response)=>{
    console.log("User connected to database successfully");
})
  .catch((err)=>{
    console.log(err);
    console.log("There is an error in the database");
})

let studentSchema = mongoose.Schema({
    firstName:String,
    lastName:String,
    email:{type: String, required:true, unique:true},
    password:{type:String, required:true,},
    matricNumber: { type: String, unique: true },
    otp:{type: String, unique: true},
    otpExpiration: {
      type: Date
    }
})

studentSchema.pre("save", function(next) {
  let student = this;
  if (!student.isModified('password')) return next();

  bcrypt.hash(student.password, 10, (err, hash) => {
    if (err) return next(err);
    student.password = hash;
    next();
  });
});

let Student = mongoose.model('Student', studentSchema);

module.exports = Student;