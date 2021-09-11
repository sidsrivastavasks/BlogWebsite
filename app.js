//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');
const  encrypt = require('mongoose-encryption');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");


const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";




const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: "Our littele secret.",
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true }
}));


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB",{ useNewUrlParser: true });


const blogSchema = new mongoose.Schema({
  email: String,
  password: String,
  article: [{title: String, post: String}]
});

blogSchema.plugin(passportLocalMongoose);

// const secret = "thisisalittlesecret.";
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const secret = "thingsonlyalosercanmake.";
blogSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const Blog = new mongoose.model("Blog", blogSchema);


passport.use(Blog.createStrategy());

passport.serializeUser(Blog.serializeUser());
passport.deserializeUser(Blog.deserializeUser());


app.get("/",function(req, res){
  res.render("initial");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});



app.get("/home",function(req,res){
  // console.log(list);

  Blog.find({"article": {$ne: null}}, function(err,result){
    if(!err){
      res.render("home", {home: homeStartingContent, allUser: result});
    }
    else{
      console.log(err);
    }
  });
});


app.get("/about",function(req,res){
  res.render("about", {about: aboutContent});
});

app.get("/contact",function(req,res){
  res.render("contact", {contact: contactContent});
});

app.get("/compose",function(req,res){

  if(!req.user){
    res.redirect("/login");
  }
  else {
      res.render("compose");
  }
});


app.post("/register",function(req,res){

  Blog.register({username: req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/login");
      });
    }
  });

});

app.post("/login",function(req,res){
  const blog = new Blog({
    username: req.body.username,
    password: req.body.password
  });
  
  req.login(blog, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        console.log(req.user);
        res.redirect("/home");
      });
    }
  });

});

app.post("/compose",function(req,res){
  //console.log(list);

  const newBlog = {
    title : req.body.Title,
    post : req.body.blog
  };

  Blog.findById(req.user.id, function(err, found){
    if(err){
      console.log(err);
    }else{
      if(found){

        found.article.push(newBlog);
        found.save(function(){
          res.redirect("/home");
        });
      }
    }
  });

});

app.get("/posts/:postID",function(req,res){
  var postID = (req.params.postID);
  Blog.find({}, function(err,result){
    if(err){
      console.log(err);
    }else{
      result.forEach(function(foundUser){
        foundUser.article.forEach(function(allPosts){
            if(postID === allPosts.id){
                res.render("post",{postTitle: allPosts.title, blogPost: allPosts.post});
            }
        });
      });
    }
  })

});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
