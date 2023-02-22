const express=require('express')
const verifyUser=require('../middlewares/verifyUser')


const controller=require('../controllers/userController')
const userModel = require('../models/userModel')
const checkUser = require('../middlewares/checkUser')



const router=express.Router()

// Aunthetications

router.get('/',controller.getUserHome)
router.get('/signup',controller.getUserSignup)
router.post('/Signup',controller.postUserSignup)
router.get('/login',controller.getUserLogin)
router.post('/login',controller.postUserLogin)
router.get('/verifyotp',controller.getverifyOtp)
router.post('/verifyotp',controller.postverifyOtp)
router.get('/logout',controller.userLogout )

// forgot password 
router.get('/forgot-pass-verify',controller.forgotPassVerify)
router.get('/forgot-Password',controller.forgotPassword)
router.post('/forgot-password-email',controller.forgotPasswordEmail)
router.post('/forgot-password-verify',)



// SHOP PAGE

router.get('/shop',controller.getuserShop)
router.post('/search-product',controller.postSearchProduct)
router.get('/sort-product',controller.getsortProduct)
router.get('/filter-product',controller.getfilterProduct)


//SINGLE  PRODUCT

router.get('/single-product/:id',controller.getuserProduct)



//CART

router.use(verifyUser)
router.use(checkUser)


router.get('/addto-cart/:id',controller.addtoCart)
router.get('/cart',controller.getCart)
router.get("/add-quantity/:id",controller.addQuantity);
router.get('/minus-quantity/:id',controller.minQuantity)
router.get('/remove-from-cart/:id',controller.removefromCart)

//profile


router.get('/profile', verifyUser,controller.getProfile)

router.post('/edit-user',controller.editUser)

router.post('/add-address',controller.addAddress)

router.post('/delete-address/:id',controller.deletAddress)

router.get('/edit-address/:id',controller.geteditAddress)

router.post('/edit-address',controller.posteditAddress)


//CHECKOUT

router.get('/checkout',controller.getCheckout)
router.post('/apply-coupon',controller.applyCoupon)
router.post('/checkout',controller.postCheckout)
router.post('/apply-wallet',controller.applyWallet)
router.get('/return',controller.getpaymentUrl)

//WISHLIST

router.get('/wishlist',controller.getWishlist)

router.get('/addto-wishlist/:id',controller.addtowishList)
router.get('/remove-wishlist/:id',controller.removeWishlist)


//ORDEr Details

router.get('/orders',controller.getOrderhistory)
router.get('/order/:id',controller.getorderProduct)
router.get('/cancel-order/:id',controller.cancelOrder)
router.get('/return-order/:id',controller.returnOrder)


router.get('/blog',controller.Blog)



module.exports=router