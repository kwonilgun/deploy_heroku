const path = require('path');

const express = require('express');

const {body} = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
//10월 10일:  Route를 보호하기 위해서 추가한다. the request will be funneled through them from left to right. This means that in here, I can now import my isAuth middleware by requiring it form my middleware folder

router.get('/add-product',isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products',isAuth, adminController.getProducts);

// // /admin/add-product => POST
router.post('/add-product',[
     body('title')
          .isString()
          .isLength({min: 3})
          .trim(),
     // body('imageUrl')
     //      .isURL(),
     body('price')
          .isFloat(),  
     body('description')
          .isLength({min:5, max:200})
          .trim()
     ],

     isAuth, adminController.postAddProduct);

// //9월20일: product edit를 하기 위해서 router에 추가함. variable dynamic path segment
router.get('/edit-product/:productId',isAuth, adminController.getEditProduct);
router.post('/edit-product',[
     body('title')
          .isString()
          .isLength({min: 3})
          .trim(),
     // body('imageUrl')
     //      .isURL(),
     body('price')
          .isFloat(),  
     body('description')
          .isLength({min:5, max:200})
          .trim()
     ],
     
     isAuth, adminController.postEditProduct);

router.delete('/product/:productId',isAuth, adminController.deleteProduct);



module.exports = router;
