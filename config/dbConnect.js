const mongoose= require('mongoose')


function connectDB(){

    mongoose.set('strictQuery',false)

    mongoose.connect(process.env.DB_CONFIG).then(result =>{
        console.log('database connected')
    }).catch((err)=>{
        console.log('database error' + err)
    })

}

module.exports=connectDB