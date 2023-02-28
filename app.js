const express = require('express')
const connectDB=require('./config/dbConnect')
const session=require('express-session')
const catcheControl=require('./middlewares/cache-control')
const MongoStore = require('connect-mongo');

const userRouter=require('./routes/userRouter')
const adminRouter=require('./routes/adminRouter');
const cloudinary = require('./config/cloudinary/cloudinary');
// const path=require('path')

require('dotenv').config()


const app=express()
connectDB()

app.get("/check", async (req, res)=>{
    try{

        let imgUpload= await cloudinary.uploader.upload('public/assets/images/about1.jpg',{
            folder:"Aeshion"
        })
        res.json(imgUpload)
    }catch(err){
        console.log(err)
        res.json(err)
    }
})

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    store: MongoStore.create({ mongoUrl: process.env.DB_CONFIG }),
    secret:'secret',
    saveUninitialized:true,
    resave:false
}))
app.use(catcheControl)
app.use(express.static(__dirname + '/public'));
app.use('/admin',adminRouter)
app.use('/',userRouter)




app.set("view engine","ejs")


app.listen(3000,()=>{console.log('http://localhost:3000')})