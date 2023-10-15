import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const app = express();
const port = 4000;


mongoose.connect('mongodb://localhost:27017', {
  dbName:'backend',
} ).then( () => console.log("Database Connected"))


const userSchema = new mongoose.Schema({
  name:String,
  email:String,
  password:String,
});

const User = mongoose.model("User", userSchema)

// using middleware
app.use(express.static(path.join(path.resolve(),"public" ))) 
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());

// setting up View Engines

app.set("view engine", "ejs");

const isAuthenticated =async (req, res, next) => {
  
  const token = req.cookies.token
  
  if(token){

    const decoded = jwt.verify(token,"jitendrarawat")
   
    req.user = await User.findById(decoded._id)

    next();
  }

  else{
  res.redirect("login");
  
  }
}


app.get( '/', isAuthenticated , (req, res) => {

  
  res.render('logout', {name:req.user.name})
} )


app.get( '/login', (req, res) => {

  res.render("login")

  });



app.get( '/logout', (req, res) => {
  res.cookie("token", "", {
    httpOnly:true,
    expires: new Date(Date.now()),
  });

  res.redirect('/')


} )



app.get('/register', (req,res) => {

res.render('register')
})


app.post('/login', async (req, res) => {

  const {email, password} =  req.body;

  let user = await User.findOne({email});


  if(!user) return res.redirect('/register')

  const isMactch  = await bcrypt.compare(password, user.password);

  if(!isMactch) return res.render("login", {email, message:"Incorrect Password"})

  const token = jwt.sign( {_id:user._id}, "jitendrarawat" )

  res.cookie("token", token, {
    httpOnly:true,
    expires: new Date(Date.now()+ 60 * 1000),
  });

  res.redirect('/')

})


app.post( '/register', async (req, res) => {

  const{name, email, password} = req.body

  let user = await User.findOne({email})

  if(user){
    return res.redirect('/login')
  }

const hashedPassword = await bcrypt.hash(password, 10)

 user = await User.create({name, email, password:hashedPassword });

  const token = jwt.sign( {_id:user._id}, "jitendrarawat" )

  res.cookie("token", token, {
    httpOnly:true,
    expires: new Date(Date.now()+ 60 * 1000),
  });

  res.redirect('/')


} );

app.post( '/login', async (req, res) => {

  const{name, email} = req.body

  let user = await User.findOne({email})

  if(!user){
    return res.redirect('/register')
  }


 user = await User.create({name, email });

  const token = jwt.sign( {_id:user._id}, "jitendrarawat" )

  res.cookie("token", token, {
    httpOnly:true,
    expires: new Date(Date.now()+ 60 * 1000),
  });

  res.redirect('/')


} );


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
