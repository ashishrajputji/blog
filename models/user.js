const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//schema
const userSchema = new Schema({
name : {type: String, required: true, uppercase : true, maxLength:50, minLength: 6},
userName : { type : String, required : true, maxLength: 40, minLength : 14},
password : { type : String, minLength : 8, required : true},
role : {type : String, required: true},
forget : {
    otp : {type : Number },
    expiresIn : {type : Number}
}
});



module.exports = mongoose.model('User',userSchema);
