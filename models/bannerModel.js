const mongoose=require('mongoose')


const bannerSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    mainImage:{
        type:Object,
        required:true
    },

    sideImages:{
        type:Array,
        required:true

    },



    description:{
        type:String
    },


    status:{
        type:String,
        default:'on-going'
    }

})

const bannerModel=mongoose.model('banner',bannerSchema)

module.exports=bannerModel