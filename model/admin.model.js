const mongoose = require('mongoose');
const bcrypt = require("bcryptjs")
const URI = "mongodb+srv://Newedufy:Isrealight112@cluster2.uezjk2x.mongodb.net/Newedufy?retryWrites=true&w=majority&appName=Cluster2"



// console.log('Connecting to:', URI);

mongoose.connect(URI)
  .then((response) => {
    console.log("Admin connected to database successfully");
  })
  .catch((err) => {
    console.log(err);
    console.log("There is an error in the database");
  })

let staffSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  adminId: { type: String, required: true, unique: true },
    otp: {
    type: String,
    unique: true
  },
  otpExpiration: {
    type: Date
  }

})



staffSchema.pre("save", function(next) {
  let admin = this;
  if (!admin.isModified('password')) return next();

  bcrypt.hash(admin.password, 10, (err, hash) => {
    if (err) return next(err);
    admin.password = hash;
    next();
  });
});
let admin = mongoose.model('admin', staffSchema);

module.exports = admin;