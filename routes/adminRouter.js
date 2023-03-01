const express=require('express')

const verifyAdmin=require('../middlewares/verifyAdmin')
const controller=require('../controllers/adminController')
const userModel=require('../models/userModel')
const adminModel=require('../models/adminModel')
const upload=require('../middlewares/multer')



const router=express.Router()

// AUNTHETICATION

router.get('/',controller.getadminHome)
router.get('/login',controller.getadminLogin)
router.post('/login',controller.postadminLogin)
router.get('/logout',controller.getadminLogout)


//USER MANAGEMENT

router.use(verifyAdmin)

router.get('/usermanage',controller.getadminusers)
router.post('/search-user',controller.searchuser)
router.post('/block-user/:id',controller.getuserBlock)
router.post('/unblock-user/:id',controller.getuserunBlock)

//CATEGORY MANAGEMENT

router.get('/category',controller.getCategoryManage)
router.get('/add-category',controller.getaddCategory)
router.post('/add-category',controller.postaddCategory)
router.post('/delete-category/:id',controller.postdeleteCategory)


// PRODUCT MANAGEMENT

router.get('/add-product',controller.getaddProduct)
router.post('/add-product',upload.fields([{name:'images', maxCount:12},{name:'image', maxCount:"1"}]),controller.postaddProduct)
router.get('/product-management',controller.getproductManage)
router.get('/delete-product/:id',controller.deleteProduct)
router.post('/search-product',controller.searchProduct)
router.get('/edit-product/:id',controller.geteditProduct)
router.post('/edit-product',upload.fields([{name:'images', maxCount:12},{name:'image', maxCount:"1"}]),controller.posteditProduct)    
router.post('/unlist-product/:id',controller.ulistProduct)
router.post('/list-product/:id',controller.listProduct)


// BANNER MANAGEMENT

router.get('/add-banner',controller.getaddBanner)
router.post('/add-banner',upload.fields([{name:'images', maxCount:3},{name:'image', maxCount:'1'}]),controller.postaddBanner)
router.get('/banner-management',controller.bannermanagement)
router.get('/edit-banner/:id',controller.geteditBanner)
router.post('/edit-banner',upload.fields([{name:'images', maxCount:3},{name:'image', maxCount:'1'}]),controller.posteditBanner)
router.post('/unlist-banner/:id',controller.unlistBanner)
router.post('/list-banner/:id',controller.listBanner)


// COUPON MANAGEMENT

router.get('/add-coupon',controller.getaddCoupun)
router.post('/add-coupon',controller.postaddCoupun)
router.get('/coupon-management',controller.couponManagement)
router.get('/edit-coupon/:id',controller.geteditCoupon)
router.post('/edit-coupon',controller.posteditCoupon)
router.post('/delete-coupon/:id',controller.deleteCoupun)
    
    
    
router.get('/order-management',controller.getorderManagement)
router.get('/edit-order/:id',controller.geteditOrder)
router.post('/edit-order',controller.posteditOrder)


router.get('/sales-report',controller.getsalesReport)

router.get('/single-order/:id',controller.getsingleOrder)

module.exports=router