const express = require('express');
const app = express();
const fs = require('fs');
var path = require('path');

const bodyParser = require('body-parser');
const ejs = require('ejs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv  = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
// Models Imports
const User = require('./models/user');
const Blog = require('./models/blogs');

// Controllers Import
const {getForgetPassword, postForgetPassword,getResetPassword, postResetPassword} = require('./controllers/mailer');
const {sendEmail} = require('./controllers/mailer');


let saltRounds = 10;
let loggedIn = "false";
let g_token = "";

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended:true
}));


var multer = require('multer');
const { error } = require('console');
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null,file.originalname)
    }
});
 
var upload = multer({ storage: storage });







// HomePage
app.get("/",(req,res)=>{
    if(loggedIn == 'false'){
        Blog.find({})
        .limit(6)
        .then((blogs)=>{     
            res.render("home",{blogs : blogs,loggedIn : loggedIn, role : ''});
        })
        .catch((error)=>{
            console.log(error);
            res.send("Unable to find any Blog");
        });
    }
    else {
        jwt.verify(g_token,process.env.secret,(err,decoded)=>{
            if(err) {
                res.send("Unable to verify");
            } else if(decoded){
                Blog.find({})
                .limit(6)
                .then((blogs)=>{   
                    res.render("home",{blogs : blogs,loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
                })
                .catch((error)=>{
                    console.log(error);
                    res.send("Unable to find any Blog");
                });
            }
        })
    }
  
});
// Blogs list page
app.get("/blogs",(req,res)=>{
    let page = Number(req.query.page) || 1;
    let limit = 6,nextPage,prev;
    let skip = (page -1) * limit; 
    let skipNext = (page)*limit; 
    if(page > 1) {prev = page-1;}
    Blog.find({}).skip(skipNext).limit(limit)
    .then((blogs)=> {if(blogs.length >= 1) nextPage = page + 1 })
    .then(()=>{
        if(loggedIn == 'false'){
            Blog.find({})
            .skip(skip)
            .limit(limit)
            .select('intro image _id')   
            .then((blogs)=>{     
               res.render("blogs",{blogs : blogs,previous : prev,nextPage : nextPage, param : 'blogs', loggedIn : loggedIn, role : ''});
            })
            .catch((error)=>{
               console.log(error);
               res.send("Unable to find any Blog");
            });
       } else {
            Blog.find({})
            .skip(skip)
           .limit(limit)
           .select('intro image _id')   
           .then((blogs)=>{
               jwt.verify(g_token, process.env.secret,(err,decoded)=>{
                   if(decoded){
                       res.render("blogs",{blogs : blogs,previous : prev,nextPage : nextPage, param : 'blogs', loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
                   } else {
                       res.redirect('/');
                   }
               });
           })
           .catch((error)=>{
               console.log(error);
               res.send("Unable to find any Blog");
           });
       }
    })
    .catch((error)=>{console.log(error)});
    
});
//Blogs list based on category
app.get("/blogs/:category",(req,res,next)=>{
    let page = Number(req.query.page) || 1;
    let category = req.params.category;
    let limit = 6,nextPage,prev;
    let skip = (page -1) * limit; 
    let skipNext = (page)*limit; 
    if(page > 1) prev = page-1;
  
    //Check if there will be more blogs to render after rendering it and assigning value to next button
    Blog.find({category : category})
        .skip(skipNext)
        .limit(limit)
        .then((blogs)=> {
            if(blogs.length > 0) {nextPage = page + 1}
         })
         .then(()=>{
 //getting blogs from database and rendering it
            if(loggedIn == 'false'){
            Blog.find({category : category})
            .skip(skip)
            .limit(limit)
            .select('intro image _id')   
            .then((blogs)=>{
                res.render("blogs",{blogs : blogs,previous : prev,nextPage : nextPage, param : category, loggedIn : loggedIn, role : ''});
             })
             .catch((error)=> res.render('blogs') );
            } else  {
             jwt.verify(g_token,process.env.secret,(err,decoded)=>{
                 if(decoded){
                     Blog.find({category : category})
                     .skip(skip)
                     .limit(limit)
                     .select('intro image _id')   
                     .then((blogs)=>{
                         res.render("blogs",{blogs : blogs,previous : prev,nextPage : nextPage, param : category, loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
                     })
                     .catch((error)=> res.render('blogs') );
                 } else { res.redirect('/');}
                });
            }
                })
                    .catch((error)=>{console.log(error)});
   
    
});

// Single blog api
app.get("/blog/:id",(req,res)=>{
    Blog.findById({_id : req.params.id})
    .then((blog)=>{
       let vdo = blog.video.split("=");
       if(loggedIn == 'false'){
        res.render("single-blog",{blog : blog, video : vdo[1], loggedIn : loggedIn, role : ''});
       } else {
        jwt.verify(g_token,process.env.secret,(err,decoded)=>{
            if(decoded){
            res.render("single-blog",{blog : blog, video : vdo[1], loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
            } else { res.redirect('/');}
        });
       }
    })
    .catch((error)=> res.send(error));
});
// Delete blog 
app.all("/blog/delete/:id",(req,res)=>{
    if(loggedIn == 'false'){
        res.redirect('/');
       }else {
        jwt.verify(g_token,process.env.secret,(err,decoded)=>{
            if(decoded.user.role == 'admin' || decoded.user.role == 'employee'){
                Blog.findByIdAndDelete({_id : req.params.id})
                .then(()=>{
                 res.redirect('/blogs');
                })
                .catch((error)=> res.send(error));
            } else { res.redirect('/');}
        });
    }
});
//Edit blog
app.route("/edit-blog/:id")
        .get((req,res)=>{   
            if(loggedIn === 'true'){
                jwt.verify(g_token,process.env.secret,(err,decoded)=>{
                    if(decoded.user.role == 'admin' || decoded.user.role == 'employee') {
                        Blog.findById({_id : req.params.id})
                        .then((blog)=>{
                            res.render("form",{param : 'edit-blog',id : blog._id, blog : blog,loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
                        })
                        .catch((error)=>{
                            res.redirect('/blogs');
                        })
                    } else {
                        res.redirect("/");
                    }
                });
            } else {
                res.redirect('/');
            }
    })
    .post(upload.single('image'),(req,res)=>{
        if(loggedIn == 'true'){
            jwt.verify(g_token,process.env.secret,(err,decoded)=>{
                if(decoded && (decoded.user.role == 'admin' || decoded.user.role == 'employee')){
                    
                    Blog.findByIdAndUpdate(req.params.id,{
                        title : req.body.title,
                        intro : req.body.intro,
                        description : req.body.description,
                        conclusion : req.body.conclusion,
                        category : req.body.category,
                        video : req.body.video,
                        image : {
                            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                            contentType: 'image/jpg'
                        }
                    })
                    .then((blog)=>{console.log("Blog Updated"); res.redirect('/blogs'); })
                    .catch((error)=>{console.log("Unable to Create Blog"); res.redirect('/');});
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }        
    });
// The Create Blog route
app.route('/create-blog')
    .get((req,res)=>{   
        if(loggedIn === 'true'){
            jwt.verify(g_token,process.env.secret,(err,decoded)=>{
                if(decoded.user.role == 'admin' || decoded.user.role == 'employee') {
                    res.render("form",{param : 'create-blog',loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
                } else {
                    res.redirect("/");
                }
            });
        } else {
            res.redirect('/');
        }
    })
    .post(upload.single('image'),(req,res)=>{
        if(loggedIn == 'true'){
            jwt.verify(g_token,process.env.secret,(err,decoded)=>{
                if(decoded && (decoded.user.role == 'admin' || decoded.user.role == 'employee')){
                    const {title, intro, description, conclusion, video, category} = req.body;
                    new Blog({
                        title : title,
                        intro : intro,
                        description : description,
                        conclusion : conclusion,
                        category : category,
                        video : video,
                        image : {
                            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                            contentType: 'image/jpg'
                        }
                    }).save()
                    .then(()=>{console.log("Blog Created"); res.redirect('/create-blog'); })
                    .catch((error)=>{console.log("Unable to Create Blog"); res.send(error);});
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }        
    });

//signup
app.route('/signup')
    .get((req,res)=>{
        if(loggedIn == 'false'){
            res.render("form",{param : 'signup',loggedIn : loggedIn, role : ''});
        }
        else {
            jwt.verify(g_token,process.env.secret,(err,decoded)=>{
                if(err) {
                    res.send("Unable to verify");
                } else{
                    if((decoded.user.role == 'admin') || (decoded.user.role == 'employee')){
                        res.render("form",{param : 'signup',loggedIn : loggedIn,role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
                    } else {
                        res.redirect('/');
                    }
                }
            });
        }
    })
    .post((req,res)=>{
    const {name , username , password, role} = req.body;
        
    //hashing password
    bcrypt.hash(password, saltRounds)
    .then(function(hash) {
        new User({name : name,userName : username,password : hash,role : role})
        .save()
        .then((result)=>{ console.log("Created new User"); res.redirect('/login'); })
        .catch((err)=>{console.log(err); res.send("Unable to create new user");  res.redirect('/signup');  });
    })
    .catch((err)=>{ console.log("Run into bcrypt error \n"); console.log(err); res.redirect('/signup'); });
});
//login
app.route('/login')
    .get((req,res)=>{
    if(loggedIn == 'false') {
        res.render("form",{param : 'login', message : '', loggedIn : loggedIn, role : ''});
    
        } else {
            res.redirect('/');
        }    
    })
    .post((req,res)=>{
    if(loggedIn == 'false'){
        const {username, password} = req.body;
        User.findOne({userName : username})
        .then((user)=>{
        bcrypt.compare(password, user.password)
                        .then((result)=> {
                                jwt.sign({user},process.env.secret,(err,token)=>{
                                    g_token = token;
                                    loggedIn = 'true';
                                    res.redirect('/');
                                   });               
                        }).catch((err)=>{console.log(err); res.redirect('/login');});
    })
    .catch((err)=>{
        console.log(err);
        res.redirect('/login');
    });
} else {
    console.log("Already loggedIn");
    res.redirect('/');
}

});
// Logout route
app.all('/logout',(req,res)=>{
        g_token = '';
        loggedIn = 'false';
        res.redirect('/');
    
});
// About Us 
app.all('/about-us',(req,res)=>{
    if(loggedIn == 'false'){
        res.render("about-us",{param : 'About Us', loggedIn : loggedIn, role : ''});
       } else {
        jwt.verify(g_token,process.env.secret,(err,decoded)=>{
            if(decoded){
            res.render("about-us",{param : 'About Us',loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
            } else { res.redirect('/');}
        });
       }
});
//Privacy  Policy
app.all('/privacy-policy',(req,res)=>{
    if(loggedIn == 'false'){
        res.render("privacy-policy",{param : 'Privacy Policy', loggedIn : loggedIn, role : ''});
       } else {
        jwt.verify(g_token,process.env.secret,(err,decoded)=>{
            if(decoded){
            res.render("privacy-policy",{param : 'Privacy Policy',loggedIn : loggedIn, role : decoded.user.role,name : decoded.user.name, username : decoded.user.userName});
            } else { res.redirect('/');}
        });
       }
});

// Forget Password route
app.get('/forget-password',getForgetPassword);
app.post('/forget-password',postForgetPassword);
// Reset Password route
app.get('/reset-password',getResetPassword);
app.post('/reset-password',postResetPassword);


//Server and databas connection
mongoose.connect('mongodb://127.0.0.1:27017/nature',{
    useNewUrlParser:true,
    useUnifiedTopology : true
})
    .then(
        ()=>{
            console.log("Database is  connected");
            app.listen(process.env.PORT,(err)=>{
                if(!err) console.log("Server is running on "+ process.env.PORT);
            });
    })
    .catch(
    (err)=>{ 
        console.log(err);
        console.log("Not connected to server");}
    );