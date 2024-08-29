const express = require("express")
const app=express()

const userModel = require("./models/user")
const postModel = require("./models/post")

const cookieparser = require("cookie-parser");
const path = require('path');

app.use(cookieparser());
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')))

const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken");
const user = require("./models/user");


app.set('view engine','ejs');

app.get("/",(req,res)=>{
    res.render('index')
})

app.post("/register",async (req,res)=>{
    console.log(req.body)
    let {name,username,age,email,password}=req.body

    let user=await userModel.findOne({email})
    if(user){
        return res.status(500).send("User Alrady Registerd")
    }
    
    const saltRounds=10;
    bcrypt.genSalt(saltRounds,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            let user = await userModel.create({
                name,
                username,
                age,
                email,
                password:hash
            })

            let token=jwt.sign({email:email,userid:user._id},'secret-key');
            res.cookie('token',token)
            res.send('User Registerd')
        })
    })

  
    
})

app.get("/login",(req,res)=>{
    res.render("login")
})



app.post('/login',async(req,res)=>{
    let {email,password}=req.body;

    let user=await userModel.findOne({email})
    if(!user){
        res.status(500).send("Email or password is invalid")
    }

    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            
            let token=jwt.sign({email:email,userid:user._id},'secret-key');
            res.cookie('token',token)
           
            res.status(200).redirect('/profile');
            
        }
        else{
            res.send('Email or Password is Incorrect')
        }
    })
})



app.get('/logout',(req,res)=>{
    res.cookie('token', '')
    res.redirect('/login')
})

//protected route
app.get('/profile',isLoggedIn,async (req,res)=>{
    console.log(req.user)
    let user = await userModel.findOne({email:req.user.email})
    res.render('profile',{user})
})

function isLoggedIn(req,res,next){
        if(req.cookies.token===''){
             res.send("not authorized")
        }
        else{
            let data=jwt.verify(req.cookies.token,'secret-key')
            req.user=data
            next();
        }
}

app.listen(3000,()=>{
    console.log("ok");
})