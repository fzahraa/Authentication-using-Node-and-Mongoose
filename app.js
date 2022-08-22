//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs= require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5"); //hashing
const bcrypt = require("bcrypt"); //for hashing + salting
const session = require("express-session");
const passport =  require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const salRounds = 10;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave : true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password : String,
  googleId: String
});
//use when we are encrypting but not hashing
//userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields : ["password"]});
//for sessions
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

//the below two lines only work for local authentication
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

//the below lines work for all kinds of authentication
passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "http://wwww.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb){
  User.findOrCraete({googleId: profile.id}, function(err, user){
    return cb(err, user);
  });
}
));


app.get("/", function(req, res){
  res.render("home");
});

app.get('/auth/google',
passport.authenticate('google', {scope: ["profile"]})
);

app.get("/auth/google/secrets",
passport.authenticate('google', {failureRedirect : "/login"}),
function(req, res){
  res.redirect("/secrets");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.listen(3000, function(req, res){
  console.log("Server is listening at post 3000");
});
//for hashing + salting
// app.post("/register", function(req, res){
//   bcrypt.hash(req.body.password, salRounds, function(err, hash){
//     const newUser = new User({
//       email : req.body.username,
//       password : hash
//     });
//     newUser.save(function(err){
//       if(!err){
//         res.render("secrets");
//       }
//       else{
//         console.log(err);
//       }
//     });
//   });
//
// });

//for hashing only
// app.post("/register", function(req, res){
// const newUser = new User({
//   email : req.body.username,
//   password : md5(req.body.password)
// });
// newUser.save(function(err){
//   if(!err){
//     res.render("secrets");
//   }
//   else{
//     console.log(err);
//   }
// });
// });


//for hashing only
// app.post("/login", function(req, res){
//   const username = req.body.username;
//   const password = md5(req.body.password);
//
//   User.findOne({email : username}, function(err, foundUser){
//     if(err){
//       console.log(err);
//     }else{
//       if(foundUser){
//         if(foundUser.password == password){
//           res.render("secrets");
//         }
//       }
//     }
//   });
// });

//for salting + hashing
// app.post("/login", function(req, res){
//   const username = req.body.username;
//   const password = md5(req.body.password);
//
//   User.findOne({email : username}, function(err, foundUser){
//     if(err){
//       console.log(err);
//     }else{
//       if(foundUser){
//         bcrypt.compare(password, foundUser.password, function(err, result){
//           if(result === true){
//             result.render("secrets");
//           }
//         });
//
//       }
//     }
//   });
// });

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});
app.post("/register", function(req, res){
  User.register({username: req.body.username} , req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/regsiter");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

//for cookies
app.post("/login", function(req, res){
  const user =  new User({
  username : req.body.username,
  password : req.body.password
});
req.login(user, function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
    });
  }
});
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});
