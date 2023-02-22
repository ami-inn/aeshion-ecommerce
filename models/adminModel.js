const mongoose=require('mongoose')

const userSchema=mongoose.Schema({


  name:{
        type:String,
        required:true
    },

    email: {
        type:String,
        required:true      
      },

      password:{
        type:String,
        required:true
      }


})

const adminModel = mongoose.model('admins',userSchema)

module.exports=adminModel