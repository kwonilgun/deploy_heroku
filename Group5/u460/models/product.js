

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//10월 4일: id는 자동으로 부여가 된다. we got a schema for our product. Mongoose now also works with so-called models and the model is also 
const productSchema = new Schema({
     title: {
          type: String,
          required : true
     },
     price: {
          type: Number,
          required : true
     },
     description: {
          type: String,
          required : true
     },
     imageUrl: {
          type: String,
          required : true
     },
     //10월 5일: we tell mongoose which other mongoose model is actually related to the data in that field. we kwon that we will store a user ID here but just because the type is objectid, this is not obvious.
     userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true

     }
});

module.exports = mongoose.model('Product', productSchema);


// const mongodb  = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product{
//   constructor(title, price, description, imageUrl, id, userId){
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl = imageUrl;
//     this._id = id ? new mongodb.ObjectId(id) : null; 
//     this.userId = userId;  
//   }

//   save() {
//     const db = getDb(); 
//     let dbOp;
//     if(this._id) {
//       //update the product
//       //9월30일 this._id를 변경했다. 
//       dbOp = db.collection('products').updateOne({_id: this._id}, {$set: this});
//     } else {
//       dbOp = db.collection('products')
//       .insertOne(this);
//     }

//     //db.collection('products').insertOne({name: 'A book', price: 12.99});
//     return dbOp
//       .then(result => {
//         console.log(result);
//       })
//       .catch(err => console.log(err));
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db
//             .collection('products')
//             .find()
//             .toArray()
//             .then(products => {
//               console.log(products);
//               return products;
//             })
//             .catch(err => {
//               console.log(err);
//             });
//   }

//   static findById(prodId) {
//     const db = getDb();
//     return db.collection('products').find({_id: new mongodb.ObjectId(prodId)})
//             .next()
//             .then(product => {
//               console.log(product);
//               return product;
//             })
//             .catch(err => console.log(err));

//   }
//   static deleteById(prodId) {
//     const db = getDb();
//     return db
//       .collection('products')
//       .deleteOne({_id: new mongodb.ObjectId(prodId)})
//       .then(result => {
//         console.log('Deleted!!!');
//       })
//       .catch(err => console.log(err))

//   }
// }



// module.exports = Product;