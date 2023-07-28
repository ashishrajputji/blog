const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Get for reset and forget Password
const getForgetPassword = (req,res) =>{
    res.render("form",{param : 'forget-password', loggedIn : 'false',message :''});
}
const getResetPassword = (req,res) =>{
    res.render("form",{param : 'reset-password', loggedIn : 'false',message : ''});
}
// Post Forget Password
const postForgetPassword = (req,res) =>{
    let otp = Math.floor((Math.random()*10000)+1);
    let expiresIn = new Date().getTime() + 300*1000; // expiry time of 5 minute
    User.findOneAndUpdate({userName : req.body.email}, {
        forget :{
            otp : otp,
            expiresIn : expiresIn
        }
    })
    .then(()=>{
        let status =  sendEmail(req.body.email,otp);
    })
    .then(()=>{
        res.redirect('/reset-password');
    })
    .catch((error)=>{
        if(error){ res.render('form',{param : 'forget-password',loggedIn : 'false',message:'Invalid User!'});}
    }) 
}
// Post RESET Password
const postResetPassword = (req,res) =>{
    User.findOne({userName : req.body.email})
    .then((user)=>{
        let currentTime = new Date().getTime();
        let diff = Number(user.forget.expiresIn)-Number(currentTime);
        if(diff < 0){
            res.render('form',{param : 'reset-password',loggedIn : 'false', message : 'OTP expired regenerate OTP'});
        } else {
            if(user.forget.otp == Number(req.body.otp)){
                bcrypt.hash(req.body.password,10)
                .then((hash)=>{
                    User.findOneAndUpdate({userName : req.body.email},{ password : hash})
                    .then(()=>{res.render('form',{param : 'reset-password',loggedIn : 'false', message : 'Successfully Changed Password'});})
                    .catch((error)=>{res.render('form',{param : 'reset-password',loggedIn : 'false', message : 'Enter a Valid OTP catch 1'});})
                })
                .catch((error)=>{res.render('form',{param : 'reset-password',loggedIn : 'false', message : 'Unable to update password'});})
            } else {
                 res.render('form',{param : 'reset-password',loggedIn : 'false', message : 'Enter a Valid OTP '});
                }
        }
    })
    .catch((error)=>{
        res.render('form',{param : 'reset-password',loggedIn : 'false', message : 'Invalid email'});
    })
}



// node mailer setUp
async function sendEmail(email,otp){
    
    let mailTransporter = nodemailer.createTransport({
        service : 'gmail',
        auth : {
            user : process.env.mailer_user,
            pass : process.env.mailer_password
        }
    });
    let details = {
        from : process.env.mailer_user,
        to : email,
        subject : 'Testing node mailer'
        // , text : 'The otp is : '+String(otp)
         , html : '<h1 style="color : pink;" >'+String(otp)+' is your otp to reset password </h1> <h2 style="color : red">Valid for 5 minute only </h2>'
    };
    await mailTransporter.sendMail(details,(err) =>{
        if(err){
            console.log('Error with nodemailer \n'+ err);
            return 0;
        } else {
            console.log('Successfully sent email');
            return 1;
        }
    });
};

module.exports = {getForgetPassword, postForgetPassword,getResetPassword, postResetPassword,sendEmail};