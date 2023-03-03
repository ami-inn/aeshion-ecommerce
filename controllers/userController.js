const userModel = require('../models/userModel')
const sendOtp = require('../actions/sendOtp')
const adminModel = require('../models/adminModel')
const verifyUser = require('../middlewares/verifyUser')
const nodemailer = require('nodemailer')
const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const bannerModel = require('../models/bannerModel')
const createId = require('../actions/createId')
const couponModel = require('../models/coupunModel')
const orderModel = require('../models/orderModel')
const axios = require('axios')

module.exports = {

    // AUNTHETICATIONS


    getUserSignup: (req, res) => {

        if (req.session.user) {
            res.redirect('/')
        } else {
            res.render('userSignup')
        }

    },

    postUserSignup: async (req, res) => {

        const user = await userModel.findOne({ email: req.body.email })

        if (user) {
            return res.render('userSignup', { duplicate: 'user already found' })
        }

        if (
            req.body.name == '' ||
            req.body.email == '' ||
            req.body.password == '' ||
            req.body.mobile == ''
        ) {
            const fieldRequired = ' All Fields Are Required'
            res.render('userSignup', { fieldRequired })
        }
        else {
            if (req.body.password != req.body.confpassword) {
                const passworder = 'password must be same'
                res.render('userSignup', { passworder })
            } else {
                randomOtp = Math.floor(1000 + Math.random() * 9000)
                req.session.otp = randomOtp
                console.log(randomOtp)
                req.session.tempUser = {
                    email: req.body.email,
                    password: req.body.password
                }

                sendOtp(req.body.email, randomOtp).then(() => {
                    console.log('otp')
                    return res.render("otpVerify", { user: req.body, email: req.session.tempUser.email })
                })
                    .catch((err) => {
                        console.log(err)
                        return res.render('userSignup', {
                            error: true,
                            message: 'email sent failed'
                        })
                    })

                // node mail code
            }
        }

    },

    getverifyOtp: (req, res) => {
        const email = req.session.tempUser.email
        console.log(email)
        res.render('otpVerify')
    },

    postverifyOtp: (req, res) => {

        const { name, email, password, mobile } = req.body
        if (req.body.otp == req.session.otp) {
            console.log('otp verified')
            const user = new userModel({ name, email, mobile, password });
            console.log(user)
            user.save((err, data) => {
                if (err) {
                    res.render("otpVerify", { error: true, message: "Somethign went wrong", ...req.body })
                    console.log(err)
                }
                else {

                    req.session.user = {
                        name,
                        id: user._id
                    }

                    req.session.tempUser = null

                    res.redirect("/login");
                }
            });
        } else {

            return res.render("otpVerify", { user: req.body, email: req.session.tempUser.email, otpmessage: "Invalid OTP", })
        }
    },

    getUserLogin: (req, res) => {
        if (req.session.user) {
            res.redirect('/')
        } else {
            res.render('userLogin')
        }
    },

    postUserLogin: async (req, res) => {
        const { email, password } = req.body

        let user = await userModel.findOne({ email })

        //finding an email from over database


        if (user) {

            if (user.status == 'block') {
                res.render('userLogin', { banmessage: 'you Are Banned !!!' })
            } else {
                if (email == user.email && password == user.password) {

                    req.session.user = {
                        name: user.name,
                        id: user._id
                    }
                    res.redirect('/')
                } else {
                    res.render('userLogin', { errorMessage: 'This Email or password is incorrect', })
                }
            }


        }

        else {
            res.render('userLogin', { errorMessage: 'This Email or password is incorrect' })
        }

    },


    forgotPassword: (req, res) => {
        res.render('forgotPassword')
    },


    forgotPasswordEmail: async (req, res) => {

        try {


            const { email } = req.body

            const user = await userModel.findOne({ email })

            if (!user) {
                return res.render('forgotPassword', { emailError: 'user not found' })
            }


            let otp = Math.floor(1000 + Math.random() * 9000)

            



            await sendOtp(req.body.email, otp)

            req.session.tempuser = {
                email, otp
            }

            return res.redirect('/forgot-pass-verify')

        }

        catch (err) {
            console.log(err)
            res.redirect('/error-page')
        }


    },

    forgotPassVerify: (req, res) => {

        try {

            res.render('forgotPasswordVerify', { email: req.session.tempuser.email })

        }
        catch (err) {
            console.log(err)
            res.redirect('/error-page')
        }



    },
    forgotPasswordVerify: async (req, res) => {

        try {


            const { otp } = req.body

            if (req.session.tempuser.otp == otp) {
                return res.render('changePassword', { email: req.session.tempuser.email })
            }

            return res.render('forgotPassword', { otpmessage: 'invalid Otp' })


        }

        catch (err) {
            console.log(err)
            res.redirect('/error-page')
        }

    },

    changePassword: async (req, res) => {

        try {
            const { password, confpassword } = req.body

            if (password == confpassword) {
                await userModel.findOneAndUpdate({ email: req.session.tempuser.email }, {
                    $set: {
                        password: password
                    }
                })

                return res.redirect("/login")
            }
            console.log('password error')
            return res.render('changePassword', { message: 'password not mathch' })
        }

        catch (err) {

            console.log(err)

            res.redirect('/error-page')

        }




    },


    userLogout: (req, res) => {
        req.session.user = null
        res.redirect('/login')
    },




    // USER PAGES


    getUserHome: async (req, res) => {

        const banners = await bannerModel.find().lean()



        if (req.session.user) {

            const _id = req.session.user.id

            const user = await userModel.findById({ _id }).lean()



            let cartLength = user.cart.length


            res.render('newhome', { userName: req.session.user.name, banners, cartLength })

        } else {
            res.render('newhome', { banners, userName: 'login' })
        }




    },





    getuserShop: async (req, res) => {

        const category = req.query.category ?? "";
        const filter = req.query.filter ?? 0;
        const key = req.query.key ?? ""//req.qery il key varunnenkil keyile value save aavum

        let count = 0;


        let products = await productModel.find({ status: 'available' }).lean()



        if (filter == 0) {
            products = await productModel
                .find({
                    name: new RegExp(key, "i"),
                    category: new RegExp(category, "i")
                })
                .sort({ uploadedAt: -1 }).lean();
            count = products.length;
        } else {
            products = await productModel
                .find({
                    name: new RegExp(key, "i"),
                    category: new RegExp(category, "i")
                })
                .sort({ price: filter }).lean();
            count = products.length;
        }



        const categories = await categoryModel.find().lean()
        return res.render('userShop1', { products, key, filter, categories, category })
    },

    getproductList: async (req, res) => {
        const category = req.query.category ?? ''
        const filter = req.query.filter ?? ''
    },

    postSearchProduct: async (req, res) => {
        const product = await productModel.find({ $and: [{ status: 'available' }, { $or: [{ name: new RegExp(req.body.name, 'i') }, { category: new RegExp(req.body.name, 'i') }] }] }).lean()
        res.render('userShop1', { product })
    },

    getsortProduct: async (req, res) => {
        const name = req.query.SortBy

        console.log(name)

        if (name == 'low-high') {
            const product = await productModel.find({ status: 'available' }).sort({ price: 1 }).lean()
            res.render('userShop1', { product })
        }
        else if (name == 'high-low') {
            const product = await productModel.find({ status: 'available' }).sort({ price: -1 }).lean()
            res.render('userShop1', { product })
        } else {
            const product = await productModel.find({ status: 'available' }).lean()
            res.render('userShop1', { product })
        }
    },

    getfilterProduct: async (req, res) => {

        const name = req.query.filterBy
        console.log(name)

        const product = await productModel.find({ $and: [{ category: name }, { status: 'available' }] }).lean()

        res.render('userShop1', { product })


    },


    // SINGLE PRODUCT

    getuserProduct: async (req, res) => {

        const _id = req.params.id
        const product = await productModel.findById(_id).lean()

        const count=await productModel.countDocuments()

        const randomIndex = Math.floor(Math.random() * count);

       

        const category=product.category

        const products = await productModel.find({category:category}).skip(randomIndex).limit(5).lean()



        let cartcount
        let cartInclude

        if (req.session.user) {
            const id = req.session.user.id


            const user = await userModel.findById({ _id: id }).lean()

            let cart = user.cart
            const cartList = cart.map(item => {
                return item.id
            })

            if (cartList.includes(_id)) {
                cartInclude = true
            } else {
                cartInclude = false
            }






            cartcount = user.cart.length





            if (user.wishlist.includes(_id)) {

                return res.render('single-product', { product, products, wish: true, cartcount, cartInclude })

            } else {
                return res.render('single-product', { product, products, wish: false, cartcount, cartInclude })
            }





        } else {
            res.render('single-product', { product, products, wish: false, cartcount, cartInclude })
        }





    },


    addtoCart: async (req, res) => {


        const _id = req.session.user.id

        const productId = req.params.id

        await userModel.updateOne({ _id }, { $addToSet: { cart: { id: productId, quantity: 1 } } })

        res.json({ success: true })


    },


    // CART

    getCart: async (req, res) => {

        const _id = req.session.user.id

        const { cart } = await userModel.findOne({ _id }, { cart: 1 })

        console.log(cart)

        const cartList = cart.map(item => {
            return item.id
        })
        console.log(cartList)
        // console.log(cart)

        const product = await productModel.find({ _id: { $in: cartList } }).lean()//$in for each elememnt in cart becaus eit has al ot ids //cart il product inte id ind . product modelil ella productsindum id indavum.aah randu id check cheythal equal aaya product kittum 

    

        let totalPrice = 0;

        product.forEach((item, index) => {
            totalPrice = totalPrice + (item.price * cart[index].quantity);
        })

        let totalMrp = 0

        product.forEach((item, index) => {
            totalMrp = totalMrp + (item.mrp * cart[index].quantity)
        })

        res.render('userCart', { product, totalPrice, cart, totalMrp })

    },


    checkQuantity: async (req, res) => {


        let address = req.user.address;
        const cart = req?.user?.cart ?? [];

        console.log(cart)

        let cartQuantities = {};
        const cartList = cart.map((item) => {
            cartQuantities[item.id] = item.quantity;
            return item.id;
        });
        let totalPrice = 0;
        let products = await productModel
            .find({ _id: { $in: cartList } })
            .lean();
        let quantityError = false;
        let outOfQuantity = [];
        for (let item of products) {
            totalPrice = totalPrice + item.price * cartQuantities[item._id];
            if (item.quantity < cartQuantities[item._id]) {
                quantityError = true;
                outOfQuantity.push({ id: item._id, balanceQuantity: item.quantity });
            } else {
            }
        }
        req.session.tempOrder = {
            totalPrice,
        };
        if (quantityError) {
            return res.json({ error: true, outOfQuantity });
        }
        return res.json({ error: false });


    },

    addQuantity: async (req, res) => {

        // const product=await productModel.findById({_id:req.params.id}).lean()


        // const quantity=product.quantity





        const user = await userModel.updateOne({ _id: req.session.user.id, cart: { $elemMatch: { id: req.params.id } } }, {

            $inc: {
                "cart.$.quantity": 1
            }

        })

        res.json({ user })

    },

    minQuantity: async (req, res) => {
        let { cart } = await userModel.findOne(
            { "cart.id": req.params.id },
            { _id: 0, cart: { $elemMatch: { id: req.params.id } } }
        );
        console.log(req.params.id);
        if (cart[0].quantity <= 1) {
            let user = await userModel.updateOne(
                { _id: req.session.user.id },
                {
                    $pull: {
                        cart: { id: req.params.id },
                    },
                }
            );

            return res.json({ user: { acknowledged: false } });
        }
        let user = await userModel.updateOne(
            { _id: req.session.user.id, cart: { $elemMatch: { id: req.params.id } } },
            {
                $inc: {
                    "cart.$.quantity": -1,
                },
            }
        );
        return res.json({ user });

    },




    removefromCart: async (req, res) => {

        const _id = req.session.user.id;
        const proId = req.params.id

        await userModel.updateOne({ _id }, {
            $pull: {
                cart: { id: proId }
            }
        })

        res.redirect('/cart')

    },









    // PROFILE

    getProfile: async (req, res) => {

        const _id = req.session.user.id

        const user = await userModel.findById({ _id }).lean()

        const coupon = await couponModel.find({ expiry: { $gt: new Date() } }).lean()





        res.render('userProfile', { user, coupon })

    },

    editUser: async (req, res) => {

        try {

            const { name, email, mobile, _id, password } = req.body


            const user = await userModel.findById({ _id }).lean()
            const pass = user.password


            if (password == pass) {

                try {
                    await userModel.findByIdAndUpdate(_id, { $set: { name, email, mobile } });

                    return res.redirect('/profile')

                } catch (err) {
                    res.redirect('/error-page')
                    console.log(err)
                }

            } else {
                res.render('userProfile', { passmessage: 'Password inCorrect !', user })
            }


        }

        catch (err) {
            console.log(err)
            res.redirect('/error-page')

        }



    },

    addAddress: async (req, res) => {

        const _id = req.session.user.id

        await userModel.updateOne({ _id }, {
            $addToSet: {
                address: {
                    ...req.body,
                    id: createId(),
                }
            }
        })

        res.redirect('back')

    },

    deletAddress: async (req, res) => {

        const _id = req.session.user.id
        const id = req.params.id

        await userModel.updateOne({ _id, address: { $elemMatch: { id } } }, {
            $pull: {
                address: { id }
            }
        })

        res.redirect('back')
    },

    geteditAddress: async (req, res) => {
        const id = req.params.id

        let { address } = await userModel.findOne({ 'address.id': id }, { _id: 0, address: { $elemMatch: { id } } })

        res.render('editAddress', { address: address[0] })
    },

    posteditAddress: async (req, res) => {



        await userModel.updateOne({ _id: req.session.user.id, address: { $elemMatch: { id: req.body.id } } }, {
            $set: {
                "address.$": req.body
            }
        })
        res.redirect("/profile")




    },



    //CHECK OUT


    getCheckout: async (req, res) => {

        const _id = req.session.user.id
        const user = await userModel.findById({ _id }).lean()
        const address = user.address
        const cart = user.cart

        const cartList = cart.map(item => {
            return item.id
        })

        const product = await productModel.find({ _id: { $in: cartList } }).lean()

        let totalPrice = 0

        product.forEach((item, index) => {
            totalPrice = (totalPrice + (item.price * cart[index].quantity))
        })

        res.render('checkout', { product, totalPrice, address, cart, user })
    },



    applyCoupon: async (req, res) => {

        try {


            const { coupon: couponCode } = req.body
            const _id = req.session.user.id

            const user = await userModel.findById({ _id }).lean()


            const address = user.address
            const cart = user.cart

            const cartList = cart.map(item => {
                return item.id
            })

            const product = await productModel.find({ _id: { $in: cartList } }).lean()

            let totalPrice = 0

            product.forEach((item, index) => {
                totalPrice = totalPrice + (item.price * cart[index].quantity)
            })


            const coupon = await couponModel.findOne({ code: couponCode })
            if (!coupon) {
                return res.render('checkout', { totalPrice, message: 'no coupon available', couponPrice: totalPrice, user, cart, address, product, cashback: 0 })
            }

            if (totalPrice < coupon.minAmount) {
                return res.render('checkout', { totalPrice, message: "Coupon not applicaple (minimum amount must be above" + coupon.minAmount + ")", couponPrice: totalPrice, user, cart, address, product, cashback: 0 })
            }

            if (coupon.expiry < new Date()) {
                return res.render('checkout', { totalPrice, message: "coupon expired", couponPrice: totalPrice, user, cart, address, product, cashback: 0 })

            }

            totalPrice = (totalPrice - coupon.cashback)



            return res.render('checkout', { totalPrice, message: "coupon applied", user, cart, address, product, couponPrice: totalPrice, cashback: coupon.cashback, couponcode: coupon.code })


        }

        catch (err) {
            console.log(err)
            res.redirect('/error-page')

        }
    },

    applyWallet: async (req, res) => {


        try {

            const _id = req.session.user.id

            const { amount } = req.body

            console.log('amount = ' + amount)

            const user = await userModel.findById({ _id }).lean()

            let wallet = user.wallet - amount





            const address = user.address
            const cart = user.cart

            const cartList = cart.map(item => {
                return item.id
            })

            const product = await productModel.find({ _id: { $in: cartList } }).lean()

            let totalPrice = 0

            product.forEach((item, index) => {
                totalPrice = (totalPrice + (item.price * cart[index].quantity))
            })

            totalPrice = (totalPrice - amount) 



            if (totalPrice < 0) {
                wallet = wallet - totalPrice
                totalPrice = 0
            }

         

            res.render('checkout', { wallet, product, totalPrice, user, address, cart, amount })



        }
        catch (err) {
            console.log(err)
            res.redirect('/error-page')
        }


    },


    postCheckout: async (req, res) => {


        try {


            const { payment, address: addressId, couponcode, walletUse } = req.body


            
            const _id = req.session.user.id

            const user = await userModel.findById({ _id }).lean()


            const cart = user.cart
            let wallet = user.wallet
            let cartQuantities = {};





            const cartList = cart.map((item) => {
                cartQuantities[item.id] = item.quantity;
                return item.id;
            });



            const { address } = await userModel.findOne({ "address.id": addressId }, { _id: 0, address: { $elemMatch: { id: addressId } } })
            console.log(address)
            const product = await productModel.find({ _id: { $in: cartList } }).lean()


            let totalPrice = 0

            let price = 0


            product.forEach((item, index) => {
                price = price + (item.price * cart[index].quantity)
            })



            const coupon = await couponModel.findOne({ code: couponcode })
            let tempCashback

            if(coupon){
                 tempCashback=coupon.cashback
            }else{
                 tempCashback=0
            }

            if(walletUse>0){
                price = (price - walletUse) 

                if (price < 0) {
                    
                    price = 0
                }

            }

        




            req.session.userAddress = {
                id: address[0].id
            }


            if (payment != 'cod') {

                if (walletUse) {
                    req.session.wallet = {
                        amount: walletUse
                    }
                }

                if (couponcode) {
                    req.session.coupon = {
                        code: couponcode
                    }
                }



                let orderId = "order_" + createId();
                const options = {
                    method: "POST",
                    url: "https://sandbox.cashfree.com/pg/orders",
                    headers: {
                        accept: "application/json",
                        "x-api-version": "2022-09-01",
                        "x-client-id": '3201245c5ea56aabb8ac690d3e421023',
                        "x-client-secret": '321852885da54288e411a7cc46a5ffa95cd276f8',
                        "content-type": "application/json",
                    },
                    data: {
                        order_id: orderId,
                        order_amount: (price-tempCashback),
                        order_currency: "INR",
                        customer_details: {
                            customer_id: _id,
                            customer_email: user.email,
                            customer_phone: user.mobile.toString(),
                        },
                        
                        order_meta: {
                            // return_url: "http://localhost:3000/return?order_id={order_id}",

                            return_url: "https://aeshion.shop/return?order_id={order_id}",
                        },
                    },
                };

                await axios
                    .request(options)
                    .then(function (response) {

                        return res.render("paymenttemp", {
                            orderId,
                            sessionId: response.data.payment_session_id,
                        });
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            } else {


                let orders = []
                let i = 0
                let cartLength = user.cart.length

                if (walletUse) {
                    wallet = wallet - walletUse

                    

                    price = (price - walletUse )

                    

                    if (price < 0) {
                        wallet = wallet-price
                        price = 0
                    }
                    await userModel.updateOne({ _id }, {
                        $set: {
                            wallet: wallet
                        }
                    })

                }



                for (let item of product) {

                    await productModel.updateOne(
                        { _id: item._id },
                        {
                            $inc: {
                                quantity: -1 * cartQuantities[item._id],
                            },
                        }
                    );

                    totalPrice = (cart[i].quantity * item.price)

                    if (coupon) {
                        totalPrice = totalPrice - (coupon.cashback / cartLength).toFixed(2)
                    }

                    if (walletUse) {
                        totalPrice = totalPrice - (walletUse / cartLength).toFixed(2)
                    }

                    totalPrice < 0 ? totalPrice = 0 : totalPrice;

                    if (walletUse) {

                        orders.push({
                            address: address[0],
                            product: item,
                            userId: req.session.user.id,
                            quantity: cart[i].quantity,
                            total: totalPrice,
                            wallet:{applied:true}
                        })


                    }else if (coupon) {
                        orders.push({
                            address: address[0],
                            product: item,
                            userId: req.session.user.id,
                            quantity: cart[i].quantity,
                            total: totalPrice ,
                            coupon: { applied: true, price: coupon.cashback, coupon: coupon }
                        })
                    }

                    else {
                        orders.push({
                            address: address[0],
                            product: item,
                            userId: req.session.user.id,
                            quantity: cart[i].quantity,
                            total: totalPrice ,

                        })
                    }


                    i++;
                }

                const order = await orderModel.create(orders) //work as insert many
                await userModel.findByIdAndUpdate({ _id }, {
                    $set: { cart: [] }
                })

                res.render('placeOrder')
            }

        }

        catch (err) {

            console.log(err)
            res.redirect('/error-page')

        }



    },

    getpaymentUrl: async (req, res) => {
        try {
            const order_id = req.query.order_id;
            const options = {
                method: "GET",
                url: "https://sandbox.cashfree.com/pg/orders/" + order_id,
                headers: {
                    accept: "application/json",
                    "x-api-version": "2022-09-01",
                    "x-client-id": '3201245c5ea56aabb8ac690d3e421023',
                    "x-client-secret": '321852885da54288e411a7cc46a5ffa95cd276f8',
                    "content-type": "application/json",
                },
            };

            const response = await axios.request(options);


            if (response.data.order_status == "PAID") {


                const _id = req.session.user.id
                const user = await userModel.findOne({ _id }).lean()

                const cart = user.cart
                let wallet = user.wallet
                let cartQuantities = {};



                const cartList = cart.map((item) => {
                    cartQuantities[item.id] = item.quantity;
                    return item.id;
                });


                const address = req.session.userAddress.id

                console.log('address' + address)

                let newAddress = await userModel.findOne({ _id }, { _id: 0, address: { $elemMatch: { id: address } } })

                console.log('new addres' + newAddress)




                const product = await productModel.find({ _id: { $in: cartList } }).lean()


                let totalPrice = 0

                let price = 0


                product.forEach((item, index) => {
                    price = price + (item.price * cart[index].quantity)
                })




                let orders = []
                let i = 0
                let cartLength = user.cart.length


                if (req.session.wallet) {

                   

                    let walletAmount = req.session.wallet.amount

                    

                    wallet = wallet - walletAmount

                    price = price - walletAmount

                    if (price < 0) {
                        wallet = wallet-price
                        price = 0
                    }

                    

                

                    await userModel.updateOne({ _id }, {
                        $set: {
                            wallet: wallet
                        }
                    })

                }


                for (let item of product) {

                    await productModel.updateOne(
                        { _id: item._id },
                        {
                            $inc: {
                                quantity: -1 * cartQuantities[item._id],
                            },
                        }
                    );

                    totalPrice = (cart[i].quantity * item.price)

                  


                    if (req.session.coupon) {

                        console.log('enterrrrr')

                        const couponcode = req.session.coupon.code


                        const coupon = await couponModel.findOne({ code: couponcode })


                        

                        totalPrice = totalPrice - (coupon.cashback / cartLength).toFixed(2)

                        
                        
                    }



                    if (req.session.wallet) {

                        let walletAmount = req.session.wallet.amount
                        totalPrice = totalPrice - (walletAmount / cartLength).toFixed(2)
                       
                    }

                    totalPrice < 0 ? totalPrice = 0 : totalPrice;

                    

                    if(req.session.wallet){

                        orders.push({
                            address:  newAddress.address[0],
                            product: item,
                            userId: req.session.user.id,
                            quantity: cart[i].quantity,
                            paymentType: 'online',
                            paid: true,
                            total: totalPrice,
                            wallet:{applied:true}
                        })


                    }


                    else if (req.session.coupon) {

                        const couponcode = req.session.coupon.code


                        const coupon = await couponModel.findOne({ code: couponcode })

                       

                        orders.push({
                            address: newAddress.address[0],
                            product: item,
                            userId: req.session.user.id,
                            quantity: cart[i].quantity,
                            total: totalPrice ,
                            paymentType: 'online',
                            paid: true,
                            coupon: { applied: true, price: coupon.cashback, coupon: coupon }
                        })
                        



                    } else {

                        orders.push({
                            address: newAddress.address[0],
                            product: item,
                            userId: req.session.user.id,
                            quantity: cart[i].quantity,
                            total: totalPrice ,
                            paymentType: 'online',
                            paid: true
                        })
                        

                    }

                    i++

                }

                const order = await orderModel.create(orders) //work as insert many
                await userModel.findByIdAndUpdate({ _id }, {
                    $set: { cart: [] }
                })


                req.session.coupon=null
                req.session.wallet=null
                req.session.address=null

               


                return res.render('placeOrder')
            } else {
                res.send('error')
            }


        } catch (err) {
            console.log(err);
            res.redirect('error-page')
        }
    },

    //Wishlist

    getWishlist: async (req, res) => {
        const _id = req.session.user.id

        const user = await userModel.findById({ _id }).lean()

        console.log(_id)

        const wishlist = user.wishlist


        const product = await productModel.find({ _id: { $in: wishlist } }).lean()//$in for each elememnt in cart becaus eit has al ot ids //cart il product inte id ind . product modelil ella productsindum id indavum.aah randu id check cheythal equal aaya product kittum 

        console.log(product)

        res.render('wishlist', { product })

    },

    addtowishList: async (req, res) => {
        const _id = req.session.user.id

        const proId = req.params.id;
        await userModel.updateOne({ _id }, {
            $addToSet: {
                wishlist: proId
            }
        })
        res.json({ success: true })

    },

    removeWishlist: async (req, res) => {
        const _id = req.session.user.id
        const id = req.params.id

        await userModel.updateOne({ _id }, {
            $pull: {
                wishlist: id
            }
        })

        res.json({ success: true })

    },


    //ORDERS

    getOrderhistory: async (req, res) => {

        try {


            const orders = await orderModel.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean()

            res.render('orderHistory', { orders })

        }

        catch (err) {

            console.log(err)

            res.redirect('/error-page')

        }


    },

    getorderProduct: async (req, res) => {
        try {
            const order = await orderModel.findOne({
                _id: req.params.id,
                userId: req.session.user.id,
            })

            return res.render('orderedProduct', { order })
        }



        catch (err) {
            console.log(err)
            return res.redirect('/error-page')
        }
    },

    cancelOrder: async (req, res) => {
        const _id = req.params.id
        const order = await orderModel.findOne({ _id })
        console.log(order)

        await orderModel.updateOne({ _id }, {
            $set: {
                orderStatus: 'cancelled'
            }
        })

        res.redirect('back')
    },

    returnOrder: async (req, res) => {
        const id = req.session.user.id
        const _id = req.params.id
        const user = await userModel.findOne({ _id: id }).lean()

        console.log(user)

        const order = await orderModel.findOne({ _id }).lean()

        await orderModel.updateOne({ _id }, {
            $set: {
                orderStatus: 'return-progressing'
            }
        })

        res.redirect('back')
    },

    Blog: (req, res) => {
        res.render('blog')
    },

    AboutUs: (req, res) => {
        res.render('about-us')
    },

    errorPage: (req, res) => {

        res.render('errorPage')

    },

    addReview: async (req, res) => {
        const { proId, review, name, email } = req.body;
        const reviewExist = await productModel.findOne({
            _id: proId,
            reviews: { $elemMatch: { userId: req.session.user.id } },
        });
        if (reviewExist) {
            await productModel.updateOne(
                { _id: proId, reviews: { $elemMatch: { userId: req.session.user.id } } },
                {
                    $set: {
                        "ratings.$.userId": req.session.user.id,
                        "ratings.$.name": name,
                        "ratings.$.email": email,
                        "ratings.$.review": review,
                        "ratings.$.date": Date.now(),
                    },
                }
            );
        } else {

            const currenDate = new Date()
            const dateString = currenDate.toLocaleDateString()


            await productModel.updateOne(
                { _id: proId },
                {
                    $addToSet: {
                        ratings: {
                            userId: req.session.user.id,
                            name: name,
                            email: email,
                            Date: dateString,
                            review,
                        },
                    },
                }
            );
        }
        res.redirect("back");

    }

}