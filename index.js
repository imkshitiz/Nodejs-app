import express, { urlencoded } from "express"
import  path  from "path"
import cookieParser from "cookie-parser"
import mongoose from "mongoose"
import  jwt  from "jsonwebtoken"
import bcrypt from "bcrypt";





// working with mongo db

// here we connect our server to the mongodb
mongoose
.connect("mongodb://127.0.0.1:27017",{
    dbName:"kshtiz",
})
.then(()=> console.log("database is connected"))
.catch((e)=> console.log(e));


 



//Now we will create the scheme for the mongodb
const userSchema = new mongoose.Schema({
    name : String, 
    email : String,
    password : String,
});

// Now we will create a model for the mongodb
const User = new mongoose.model("User",userSchema);




// created express server
const app = express();

// we will use middleware to use static folder which is inside in public folder 
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());



// working with middle ware

// we will use middleware to use the folder inside the views folder 
app.set("view engine","ejs");




const isAuthenticate =  async (req,res,next)=>{
    const {token} = req.cookies;
    if(token){
        const decode = jwt.verify(token, "lkfldsfljdshfldshflds" );
        req.user = await User.findById(decode._id);
        next();
    }
    else{
        res.redirect("/login");
    }
}
 


app.post("/login", async (req,res)=>{
    const {email,password} = req.body;

    let user = await User.findOne({email});

    if(!user) return res.redirect("/register");

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) return res.render("login",{message:"Incorrect password"});

    const token = jwt.sign({_id:user._id},"lkfldsfljdshfldshflds");


    res.cookie("token", token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");

}); 


app.post("/register",async (req,res)=>{
    const {name,email,password} = req.body;

    let user = await User.findOne({email})
    if(user){
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password,10);

     user = await User.create({
        name,
        email,
        password : hashedPassword,
    })

    const token = jwt.sign({_id:user._id},"lkfldsfljdshfldshflds");


    res.cookie("token", token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");
})



app.get("/", isAuthenticate, (req,res)=>{ 
    res.render("logout",{ name : req.user.name});
});



app.get("/register",(req,res)=>{
    res.render("register");
})



app.get("/login",(req,res)=>{
    res.render("login");

});



app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now()),
    });
    res.redirect("/");
})



app.listen(5000,(req,res)=>{
    console.log("server is runninng ");
});

// so in the databse we are showin the password this is not a good practice 
// so for this we have installed a new dependencies "bcrypt"