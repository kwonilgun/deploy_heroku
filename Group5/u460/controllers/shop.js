
const fs = require('fs');
const path = require('path');

const stripe = require('stripe')('sk_test_51LurEaFUoRBVCqC9355CEQk0YY0OvkU8fVYKYo3WqQeooEDlU87wvVbxI0aCojoDsih5kVIuR9KxYgVGgJnDJ3Gx00AgSGZChN');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order  = require("../models/order");
const product = require('../models/product');

const  ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {

  console.log('export.getProducts');
  console.log(req.session.isLoggedIn);
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  // Product.find()
  //   .then(products =>{
  //     res.render('shop/product-list', {
  //       prods: products,
  //       pageTitle: 'All Products',
  //       path: '/products',
  //       // isAuthenticated: req.session.isLoggedIn
  //     });
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });
};

exports.getProduct = (req, res, next) => {
  console.log('getProduct');
  const prodId = req.params.productId;


  //findById는 동작 안함.
  Product.findById(prodId)
    .then(product => {
        console.log(product);
        // if(product.length == 0) return;
        res.render('shop/product-detail', {
          product: product,
          pageTitle: 'Detailsss',
          path: '/products',
          // isAuthenticated: req.session.isLoggedIn
        });
        
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  
 
  // res.redirect('/');
}

exports.getIndex = (req, res, next) => {
  
  //10월 19일: countDocuments: it only counts them which is faster than retrieving them and skip and  limit also manage  or are managed by mongodb in a way that you only transfer the items over the wire which you really need.  so this is not doing some server side filtering of the data, it really filters it on the database server. 
  const page = +req.query.page || 1;
  let totalItems;
  console.log('export.getIndex: page = ' + page);
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page-1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    
    .then(products =>{
        res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        // isAuthenticated: req.session.isLoggedIn,
        // //10월 10일 추가: Now here we would have to pass a new piece of information into the render method, you could name it csrf token, that name is up to you and you get it form request and then there, there will be a csrf token method. This method is provided by the csrf middleware which we added by this package. So now this will generate such a token and we will store it in csrf token which we then can use in
        
        // csrfToken: req.csrfToken()
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  
};


// //9월27일 : I want to use the cart associated with my existing user to get all the products in it 
exports.getCart = (req, res, next) => {
  console.log('exports.getCart.......');
  req.user
    .populate('cart.items.productId')
    //.execPopulate()
    .then( user => {
        const products = user.cart.items;
        console.log(products);
        res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
                // isAuthenticated: req.session.isLoggedIn
              });
    
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}
  
    
  
  

exports.postCart = (req, res, next) => {
  
  const prodId = req.body.productId;
  Product.findById(prodId)
        .then(product => {

          //10월4일 : app.js에서 새로운 유저 모델을 생성을 했기 때문에 addToCart를 적용할 수 있다. 
          return req.user.addToCart(product);
          
        })
        .then(result => {
          console.log(result); 
          res.redirect('/cart'); 
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
 
}

  
  



exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  
}

exports.getCheckout = (req, res, next) => {

  console.log('exports.getCheckOut');
  let products;
  let total = 0;

  req.user
    .populate('cart.items.productId')
    //.execPopulate()
    .then( user => {
        const products = user.cart.items;
        console.log(products);

        let total = 0;
        products.forEach(p => {
          total += p.quantity * p.productId.price;
        });

        return stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: products.map(p => {
            return { 
              // name: p.productId.title,
              // description: p.productId.description,
              // currency: 'usd',
              // amount: p.productId.price * 100,
              price_data: {
                currency: 'usd',
                unit_amount: 1000,
                product_data: {
                  name: p.productId.title,
                  description: p.productId.description,
                  images: ['https://example.com/t-shirt.png'],
                }
              },
              quantity: p.quantity
            };
          }),
          mode: 'payment',
          success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
          cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
        });
      })
      .then(session => {
        res.render('shop/checkout', {
          path: '/checkout',
          pageTitle: 'Checkout',
          products: products,
          totalSum: total,
          sessionId: session.id
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });


};

exports.getCheckoutSuccess = (req, res, next) => {
  
  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then( user => {
        const products = user.cart.items.map(i=> {
          return {quantity: i.quantity, product: {...i.productId._doc}};
        });
        //10월 6일 : order 모델을 생성한다. 
        const order = new Order({
          user: {
            // name: req.user.name,
            email: req.user.email,
            userId: req.user
          },
          products: products
        });
        order.save()
    })
    .then(result => {
      return req.user.clearCart();
      
    })
    .then(() =>{
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  };


exports.postOrder = (req, res, next) => {
  
  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then( user => {
        const products = user.cart.items.map(i=> {
          return {quantity: i.quantity, product: {...i.productId._doc}};
        });
        //10월 6일 : order 모델을 생성한다. 
        const order = new Order({
          user: {
            // name: req.user.name,
            email: req.user.email,
            userId: req.user
          },
          products: products
        });
        order.save()
    })
    .then(result => {
      return req.user.clearCart();
      
    })
    .then(() =>{
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  };

exports.getOrders = (req, res, next) => {

  Order.find({'user.userId': req.user._id})
    .then(orders => {
        res.render('shop/orders', {
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders,
          // isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  
};


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  
  //console.log(invoicePath);

  Order.findById(orderId)
    .then(order => {
      if(!order) {
        return next(new Error('No order found'))
      }
      if(order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }

      const invoiceName = 'invoice-' + '5bb5d4bb26b636bdc25360a3' +'.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName +'"');
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      // pdfDoc.text('Hello world!!');
      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      })
      pdfDoc.fontSize(14).text('----------------------------');

      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice = totalPrice + prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(prod.product.title + '-' + prod.quantity + 'x' +'$' + prod.product.price);

      })
      pdfDoc.text('----------------------------');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if(err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName +'"')
      //   res.send(data);
      // });

      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName +'"');
      // file.pipe(res);

    })
    .catch(err => next(err));
};

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout'
//   });
// };
