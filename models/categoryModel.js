const mongoose=require('mongoose');
const { array } = require('../middlewares/multer');
const categorySchema= new mongoose.Schema({
    category:{
        type:String,
        required:true
    },
    subcategory:{
        type:Array

    }
})
const categoryModel= mongoose.model("category", categorySchema);
module.exports=categoryModel;