const mongoose=require('mongoose')
const couponSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    code:{
        type:String,
        required:true
    },
    minAmount:{
        type:Number,
        required:true
    },
    cashback:{
        type:Number,
        required:true
    },
    expiry:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        default:'available'
    }
})
const couponModel= mongoose.model("coupon", couponSchema);

module.exports=couponModel