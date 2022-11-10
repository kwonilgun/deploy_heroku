//const mongodb = require('mongodb');

const fileHelper = require('../util/file');

const Product = require('../models/product');
const {validationResult} = require('express-validator');


exports.getAddProduct = (req, res, next) => {
  
  // if(!req.session.isLoggedIn) {
  //   return res.redirect('/login');
  // }
  console.log('exports.getAddProduct');

  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
    // isAuthenticated: req.session.isLoggedIn
    
  });
};


//u-159 updating products...
exports.getEditProduct = (req, res, next) => {
  

  const editMode = req.query.edit;   //key
  console.log('getEditProduct');
  console.log(editMode)

  if(!editMode) {
    return res.redirect('/');
  }
 
 
  const prodId = req.params.productId;
  console.log('prodId :' + prodId);
  
  
  Product.findById(prodId)
    .then(product => {
      
      if(!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
        // isAuthenticated: req.session.isLoggedIn
        
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  
};

// 💇‍♀️: 9월 20일 추가함 


exports.postEditProduct = (req, res, next) => {
  console.log('exports.postEditProduct');

  const prodId = req.body.productId;

  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description:updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
      
    });
  }
  
  Product.findById(prodId)
    .then(product => {

      if(product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }

      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      // product.imageUrl = updatedImageUrl;
      if(image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path
      }
      return product.save().then(result => {
        console.log('UPdated Prodcut!');
        res.redirect('/admin/products');
      });
    })
    
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  



};

exports.postAddProduct = (req, res, next) => {
  console.log('export.postAddProduct');
  console.log(req.user);
  
  const title = req.body.title;

  //10월19일 : 이미지 파일 처리를 위해서 수정함. 
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is an image',
      validationErrors: []
      
    });
  }

  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
      
    });
  }

  //10월 19일: 
  const imageUrl = image.path;

  const product = new Product({
    title:title, 
    price:price, 
    description:description, 
    imageUrl:imageUrl,
    userId: req.user
  });
  
  //9월23일 : sequealize - to create a new associated object So since a user has many products or a product belongs to a user as we learned or as we set it up in app.js, since we have that relation defined, sequelize automatically
  //여기가 Magic way connect 이다. 
  product.save()
  .then(result => {
    //console.log(result);
    console.log('Created Product');
    res.redirect('/admin/products')
  }).catch(err => {
        // return res.status(500).render('admin/edit-product', {
        //   pageTitle: 'Add Product',
        //   path: '/admin/add-product',
        //   editing: false,
        //   hasError: true,
        //   product: {
        //     title: title,
        //     imageUrl: imageUrl,
        //     price: price,
        //     description: description
        //   },
        //   errorMessage: "Database operations failed, please try again",
        //   validationErrors: []
          
        // });

        //res.redirect('/500');
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);

  });
  
};

exports.getProducts = (req, res, next) => {
  //Product.findAll()
  
  console.log("exportsss.getProducts");
  console.log("isAuthenticate:" + req.session.isLoggedIn);

  //10월 12일: 로그인 사용자만 product에 대한 접근을 허용한다.  Authorization simply means we restrict the permissions and we can do that by restricting the data .. user ID is equal to the user id of the currently logged-in user, so user ID is equal to request user

  Product.find({userId: req.user._id})
  
  .then(products => {
      console.log(products);
      res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      // isAuthenticated: req.session.isLoggedIn
    });
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
    
  
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  //Product.findByIdAndDelete(prodId)
  Product.findById(prodId)
    .then(product => {
      if(!product) {
        return next( new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id:prodId, userId: req.user._id})
    })
 
    .then(() => {
      console.log('Delete success!!');
      // res.redirect('/admin/products');
      res.status(200).json({
        message: "Success!!"
      });
    })
    .catch(err => {
      res.status(500).json({message: "Deleting product failed"});
    });


  
} 