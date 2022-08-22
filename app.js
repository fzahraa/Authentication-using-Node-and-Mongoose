//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs= require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5"); //hashing
const bcrypt = require("bcrypt"); //for hashing + salting
const app = express();
const salRounds = 10;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password : String
});
//use when we are encrypting but not hashing
//userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields : ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("home");
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
app.post("/register", function(req, res){
  bcrypt.hash(req.body.password, salRounds, function(err, hash){
    const newUser = new User({
      email : req.body.username,
      password : hash
    });
    newUser.save(function(err){
      if(!err){
        res.render("secrets");
      }
      else{
        console.log(err);
      }
    });
  });

});

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
app.post("/login", function(req, res){
  const username = req.body.username;
  const password = md5(req.body.password);

  User.findOne({email : username}, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        bcrypt.compare(password, foundUser.password, function(err, result){
          if(result === true){
            result.render("secrets");
          }
        });

      }
    }
  });
});
