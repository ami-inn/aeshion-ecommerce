
const userModel=require('../models/userModel')
const adminModel=require('../models/adminModel')
const categoryModel=require('../models/categoryModel')
const productModel=require('../models/productModel')
const bannerModel=require('../models/bannerModel')
const couponModel=require('../models/coupunModel')
const moment = require('moment')
const orderModel = require('../models/orderModel')


   

module.exports= {

    // HOME

    getadminHome: async (req,res)=>{

        if(req.session.admin){  

            const order= await orderModel.find().lean()
            const monthlyDataArray= await orderModel.aggregate([{$match:{orderStatus:"delivered"}},{$group:{_id:{$month:"$createdAt"}, sum:{$sum:"$total"}}}])
            const monthlyReturnArray=await orderModel.aggregate([{$match:{orderStatus:"returned"}},{$group:{_id:{$month:'$createdAt'},sum:{$sum:'$total'}}}])
            
            console.log(monthlyReturnArray)
            console.log(monthlyDataArray)
            const user=await userModel.find().lean()

            

            let users=user.length
            let totalOrders=order.length
            let totalRevenue=0
            let totalPending=0


            let deliveredOrders=order.filter((item)=>{
                if(item.orderStatus=='pending'){
                    totalPending++
                }

                if(item.orderStatus == 'delivered'){
                    totalRevenue=totalRevenue+item.total
                }

                return item.paid
            })
            let totalDispatch = deliveredOrders.length;
            

            let monthlyDataObject={}
            let monthlyReturnObject={}

            monthlyDataArray.map(item=>{
              monthlyDataObject[item._id]=item.sum
            })

            monthlyReturnArray.map(item=>{
                monthlyReturnObject[item._id]=item.sum
              })

              let monthlyReturn=[]
              for(let i=1;i<=12;i++){
                monthlyReturn[i-1]= monthlyReturnObject[i] ?? 0
              }

            let monthlyData=[]
            for(let i=1; i<=12; i++){
                monthlyData[i-1]= monthlyDataObject[i] ?? 0
              }


              console.log(monthlyReturn)
              
           



            res.render('adminHome',{totalOrders,users,totalRevenue,monthlyData,monthlyReturn})
        }else{
            res.redirect('/admin/login')
        }
       
    },

    // ADMIN AUNTHETICATIONS

    getadminLogin:(req,res)=>{
        if(req.session.admin){
            res.redirect('/admin/')
        }else{
            res.render('adminLogin')
        }
    },

    postadminLogin:async (req,res)=>{
        const {email,password}=req.body
        console.log(req.body)

        let admin=await adminModel.findOne({email})
        console.log(admin)

        if(admin){
            if(password==admin.password){
                req.session.admin = {
                    name:admin.name
                }
                res.redirect('/admin/')
            }else{
                console.log('first')
                res.render('adminLogin')
            }
        }else{
            res.render('adminLogin')
        }

    },

    
    getadminLogout:(req,res)=>{
        req.session.admin=null
        res.redirect('/admin/login')
    },


    // USER MANAGEMENT

    getadminusers:async(req,res)=>{
        let users=await userModel.find({},{password:0}).lean()
        console.log(users)
        res.render('usermanage',{users})
    },


    searchuser:async (req,res)=>{
        const {key} = req.body
    const users= await userModel.find({$or:[{name:new RegExp(key,"i")},{email:new RegExp(key,'i')}]}).lean()
    console.log(users)
    res.render('usermanage',{users})
     },

     getuserBlock:async(req,res)=>{
        var id=req.params.id
        console.log(id)
        
        await userModel.findByIdAndUpdate(id,{$set:{status:'block'}}).then(()=>{

            res.redirect('/admin/usermanage')
        }).catch((err)=>{
            console.log(err)
        })
        
     },


     getuserunBlock:async(req,res)=>{
        var id=req.params.id
        console.log(id)
        
        await userModel.findByIdAndUpdate(id,{$set:{status:'unblock'}}).then(()=>{

            res.redirect('/admin/usermanage')
        }).catch((err)=>{
            console.log(err)
        })
        
     },



    //  CATEGORY MANAGEMENT


     getaddCategory:(req,res)=>{
        res.render('addCategory')
     },

     postaddCategory:(req,res)=>{
        if(req.body.category=="" || req.body.subcategory==''){
            return res.redirect("/admin/add-category")
        }else{

            const {category}=req.body
            

            const categories=new categoryModel({category})
            categories.save((err, data)=>{
                if(err){
                    return res.redirect("/admin/add-category")
                }
                res.redirect("/admin/category")
            })
        }

     },

     getCategoryManage:async(req,res)=>{
        const categories=await categoryModel.find().lean()
        res.render('categoryManage',{categories})
     },

     postdeleteCategory:async(req,res)=>{
        const _id=req.params.id
        await categoryModel.deleteOne({_id})
        res.redirect('/admin/category')
     },


    //  PRODUCT MANAGEMENT


     getaddProduct: async (req,res)=>{
        const categories = await categoryModel.find().lean()
        res.render('add-product',{error:false,categories})
     },


     postaddProduct: async (req,res)=>{

        try{

            const {name,category,quantity,price,brand,description,mrp}=req.body

            console.log(req.body)

            const product=new productModel({
                name,category,quantity,price,brand,description,mrp,mainImage:req.files.image[0],
                sideImages:req.files.images
            })
    
            product.save(async (err,data)=>{
                if(err){
                    console.log(err)
                    const categories=await categoryModel.find().lean()
                    res.render('add-product',{error:true, message:"Fields validation failed", categories})
                }else{
                    res.redirect('/admin/product-management')
                    console.log('completed')
                }
            })

        }catch(err){
            console.log(err)
            const categories=await categoryModel.find().lean()
            res.render('admin/add-product',{error:true,message:'please enter all the fields'})
        }

       

     },

     getproductManage:async (req,res)=>{
        const products=await productModel.find().sort({createdAt:-1}).lean()

        res.render('product-Management',{products})

     },

     deleteProduct:async(req,res)=>{
        const _id=req.params.id
        await productModel.deleteOne({_id})
        res.redirect('/admin/product-management')
     },

     searchProduct:async (req,res)=>{
        const products=await productModel.find({$or:[{name: new RegExp(req.body.name, 'i')},{category: new RegExp(req.body.name, 'i')}]}).lean()
        res.render('product-Management',{products})
     },

     geteditProduct:async (req,res)=>{
        const _id=req.params.id
        const product = await productModel.findOne({_id})
        const categories=await categoryModel.find().lean()
        res.render('edit-product',{product,error:false,categories})
     },

     posteditProduct: async (req,res)=>{
        try{

            const {name,category,quantity,mrp,brand,price,description,_id}=req.body

            console.log(req.body)
            
           // console.log(req.files)

            if(req.files.image && req.files.images){
                console.log('first')
                await productModel.findByIdAndUpdate(_id,{$set:{
                    name,category,quantity,brand,price,mrp,description,mainImage:req.files.image[0],
                    sideImages:req.files.images
                }})

                return res.redirect('/admin/product-management')
            }

            if(!req.files.image && req.files.images){
                console.log('second')
                await productModel.findByIdAndUpdate(_id,{$set:{
                    name,category,quantity,brand,mrp,price,description,
                    sideImages:req.files.images
                }})

                return res.redirect('/admin/product-management')
            }

            if(req.files.image && !req.files.images){
                console.log('third')
                await productModel.findByIdAndUpdate(_id,{$set:{
                    name,category,quantity,brand,mrp,price,description,mainImage:req.files.image[0]
                }})

                return res.redirect('/admin/product-management')
            }

            if(!req.files.image && !req.files.images){
                console.log('four')

                await productModel.updateOne({_id},{$set:{
                    name,category,quantity,brand,mrp,price,description,
                  
                }})

                return res.redirect('/admin/product-management')
            }

            return res.redirect('/admin/product-management')

        }catch(err){
            console.log('ful err')
            console.log(err)
        const categories= await categoryModel.find().lean();
        res.render('edit-Product',{error:true, message:"Please fill all the fields", categories, product:req.body})
    
        }
     },

     ulistProduct:async (req,res)=>{

        const _id=req.params.id

        await productModel.findByIdAndUpdate(_id,{$set:{status:'unavailable'}}).then(()=>{

            res.redirect('/admin/product-management')
        }).catch((err)=>{
            console.log(err)
        })

     },

     listProduct:async (req,res)=>{ 

        const _id=req.params.id

        await productModel.findByIdAndUpdate(_id,{$set:{status:'available'}}).then(()=>{

            res.redirect('/admin/product-management')
        }).catch((err)=>{
            console.log(err)
        })

     },



    //  BANNER MANAGEMENT



     getaddBanner:(req,res)=>{

        res.render('addBanner')

     },

     postaddBanner:async (req,res)=>{

        try{
            const{name,category,description}=req.body

            console.log(req.body)
    
            const banner=new bannerModel({
                name,category,description,mainImage:req.files.image[0],sideImages:req.files.images
            })
    
            banner.save(async (err,data)=>{
    
                if(err){
                    console.log(err)
                    res.render('addbanner')
                }else{
    
                    res.redirect('/admin/banner-management')
                    console.log('completed')
    
                }
    
            })
    
    
        }

        catch(err){
            console.log(err)
            res.send('404 Error')
        }

            },

     bannermanagement:async (req,res)=>{

        const banner=await bannerModel.find().lean()

        console.log(banner)

        res.render('bannerManagement',{banner})

     },

     geteditBanner:async(req,res)=>{

        const _id=req.params.id
        const banner = await bannerModel.findOne({_id})
        res.render('editBanner',{banner})

     },

     posteditBanner:async(req,res)=>{


        try{
            const {name,category,description,_id}=req.body

            console.log(req.body)

          
            
           console.log(req.files)

            if(req.files.image && req.files.images){
                console.log('first')
                await bannerModel.findByIdAndUpdate(_id,{$set:{
                    name,category,description,mainImage:req.files.image[0],sideImages:req.files.images
                }})

                return res.redirect('/admin/banner-management')
            }

            if(!req.files.image && req.files.images){
                console.log('second')
                await bannerModel.findByIdAndUpdate(_id,{$set:{
                    name,category,description,
                    sideImages:req.files.images
                }})

                return res.redirect('/admin/banner-management')
            }

            if(req.files.image && !req.files.images){
                console.log('third')
                await bannerModel.findByIdAndUpdate(_id,{$set:{
                    name,category,description,mainImage:req.files.image[0]
                }})

                return res.redirect('/admin/banner-management')
            }

            if(!req.files.image && !req.files.images){
                console.log('four')

                await bannerModel.findByIdAndUpdate(_id,{$set:{
                    name,category,description,
                  
                }})

                return res.redirect('/admin/banner-management')
            }

            return res.redirect('/admin/banner-management')

        }catch(err){
            console.log('ful err')
            console.log(err)

        res.send('there is some issue in edit banner')
    
        }


     },

     unlistBanner:async(req,res)=>{

        const _id=req.params.id

        await bannerModel.findByIdAndUpdate(_id,{$set:{status:'stopped'}})

        res.redirect('/admin/banner-management')

     },

     
     listBanner:async(req,res)=>{

        const _id=req.params.id

        await bannerModel.findByIdAndUpdate(_id,{$set:{status:'on-going'}})

        res.redirect('/admin/banner-management')

     },



    //  COUPON MANGEMENT


     getaddCoupun:(req,res)=>{
        res.render('addCoupun')
     },


     postaddCoupun: async(req,res)=>{

    

        const {name,cashback,minAmount,expiry,code}=req.body

        const coupon=new couponModel({name,cashback,minAmount,expiry,code})

        coupon.save((err,data)=>{
            if(err){
                console.log(err)
            }

            res.redirect('/admin/coupon-management')
        })

     },
     
     couponManagement:async(req,res)=>{

        const coupon=await couponModel.find().lean()
        console.log(coupon)

        res.render('couponManagement',{coupon})
     },

     geteditCoupon:async (req,res)=>{

        const _id=req.params.id

        let coupon= await couponModel.findOne({_id})

        const expiry=moment(coupon.expiry).utc().format('YYYY-MM-DD')
        const {name, code, cashback, minAmount}=coupon;
        
        res.render('editCoupun',{coupon:{name,_id,code,cashback,minAmount,expiry}})

     },

     posteditCoupon: async (req,res)=>{

        try{

            const {name,cashback,code,minAmount,expiry,_id}=req.body

            await couponModel.findByIdAndUpdate(_id,{
                $set:{
                    name, cashback, minAmount, expiry, code
                }
            })
    
            res.redirect('/admin/coupon-management')

        }

        catch(err){
            console.log(err)
            res.redirect('/admin/coupon-management')
        }

     

     },


     deleteCoupun:async (req,res)=>{

        try{
            const _id=req.params.id
            await couponModel.deleteOne({_id})

            res.redirect('/admin/coupon-management')
        }

        catch(err){
            console.log(err)
            res.redirect('/admin/coupon-management')
        }
     },

     //ORDERS

     getorderManagement:async (req,res)=>{
        
        const orders=await orderModel.find().sort({createdAt:-1}).lean()

    
        // grouping the orders with orderIs
        // var pipeline=orderModel.aggregate([
        //     { $group: { _id: '$userId', orders: { $push: '$$ROOT' } } }
        //   ], function (err, result) {
        //     if (err) {
        //       console.log(err);
        //     } else {
        //         // result.forEach(group => {
        //         //     console.log(`Orders for user ${group._id}:`);
        //         //     console.log(group.orders);
        //         //   });
        //         // console.log(result)            
        //     }
        //   });

          

         
          
      
        res.render('orderManagement',{orders})
     },

     geteditOrder:async (req,res)=>{
        const order= await orderModel.findOne({_id:req.params.id})
        console.log(order)
        res.render('edit-order',{order})
     },

      posteditOrder: async (req,res)=>{
        const {status,_id}=req.body

        console.log(req.body)

        if(status == 'returned'){

            const order=await orderModel.findOne({_id}).lean()


            await orderModel.updateOne({_id},{
                $set:{
                    orderStatus:status
                }
            })

            await userModel.updateOne({_id:order.userId},{$inc:{wallet:order.total}})
        }


        if(status=='delivered'){
            await orderModel.updateOne({_id},{
                $set:{
                    paid:true,
                    orderStatus:status
                }
            })
            return res.redirect('/admin/order-management')
        }

        await orderModel.updateOne({_id},{
            $set:{
                orderStatus:status
            }
        })

        return res.redirect('/admin/order-management')

     },


     getsalesReport:async(req,res)=>{
        let startDate = new Date(new Date().setDate(new Date().getDate() - 8))
        let endDate = new Date()
        
        if(req.query.startDate){
            startDate = new Date(req.query.startDate)
            startDate.setHours(0, 0, 0, 0);
        }
        if(req.query.endDate){
            endDate = new Date(req.query.endDate)
            endDate.setHours(24, 0, 0, 0);
        }
        if(req.query.filter=='thisYear'){
          let currentDate= new Date()
          startDate= new Date(currentDate.getFullYear(), 0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate= new Date(new Date().setDate(new Date().getDate() +1 ))
          endDate.setHours(0, 0, 0, 0);
        }
        if(req.query.filter=='lastYear'){
          let currentDate= new Date()
          startDate= new Date(currentDate.getFullYear()-1, 0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate= new Date(currentDate.getFullYear()-1, 11, 31);
          endDate.setHours(0, 0, 0, 0);
        }
        if(req.query.filter=='thisMonth'){
          let currentDate= new Date()
          startDate= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          endDate= new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);
          endDate.setHours(0, 0, 0, 0);
        }
        if(req.query.filter=='lastMonth'){
          let currentDate= new Date()
          startDate= new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate.setHours(0, 0, 0, 0);
        }
    
      const orders = await orderModel
        .find({orderStatus:'delivered',createdAt: { $gt: startDate, $lt: endDate },})
        .sort({ createdAt: -1 })
        .lean();
      // console.log(orders)
      let totalOrders = orders.length;
      let totalRevenue = 0;
      let totalPending = 0;
      let deliveredOrders = orders.filter((item) => {
    
        if (item.orderStatus == "pending" || item.orderStatus == 'outForDelivery') {
          totalPending++;
        }
    
        totalRevenue = totalRevenue + item.product.price;
        return item.paid;
      });
      let totalDispatch = deliveredOrders.length;
    
      let orderTable=[]
      orders.map(item=>{
        orderTable.push([item.product.name, item.total, item.orderStatus, item.quantity, item.createdAt.toLocaleDateString(),item.paid])
      })
      console.log(startDate, endDate)
      let byCategory= await orderModel.aggregate([{$match:{createdAt: { $gt: startDate, $lt: endDate }}},{$group:{_id:"$product.category", count:{$sum:1}, price:{$sum:"$product.price"}}}])
      let byBrand= await orderModel.aggregate([{$match:{createdAt: { $gt: startDate, $lt: endDate}}},{$group:{_id:"$product.brand", count:{$sum:1}, profit:{$sum:"$product.price"}}}])
    
      console.log(byCategory)
    
      let category={}
      let categoryIds= byCategory.map(item=>{
        category[item._id]={count:item.count, total:item.price}
        return item._id
      });

      console.log(categoryIds)

    //   let categories= await categoryModel.find({_id:{$in:categoryIds}}, {category:1}).lean()
    //   categories.forEach((item, index)=>{
    //     categories[index].count= category[item._id].count
    //     categories[index].profit= category[item._id].total
    //   })

      console.log(byCategory)

      let filter=req.query.filter ?? "";
      if(!req.query.filter && !req.query.startDate){
        filter="lastWeek"
      }
      res.render("sales-report", {
        orders,
        totalDispatch,
        totalOrders,
        totalPending,
        totalRevenue,
        startDate:moment(new Date(startDate).setDate(new Date(startDate).getDate() + 1)).utc().format('YYYY-MM-DD'),
        endDate:moment(endDate).utc().format('YYYY-MM-DD'),
        orderTable,
        categories:byCategory,
        byBrand,
        filter
      });

     }






}