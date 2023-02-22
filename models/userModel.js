const mongoose= require('mongoose')

const userSchema=new mongoose.Schema({

   

    name: {
        type:String,
        required:true      
      },

     

    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    confpassword: {
        type:String,
           
      },

      status:{
        type:String,
        default:'unblock' 
    },

    address:{
        type:Array,
        default:[]
    },

    cart:{
        type:Array,
        default:[]
    },

    wishlist:{
        type:Array,
        default:[]
    },
    wallet:{
        type:Number,
        default:0
    }
})

const userModel = mongoose.model('users',userSchema)

module.exports=userModel