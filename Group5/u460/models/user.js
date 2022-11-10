
//이것이 mongoose의 힘이다. 많은 내장된 함수가 있고, 이것을 이용한다. 


const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema ({
  
     email: {
          type: String,
          required: true
     },
     password: {
          type: String,
          required: true
     },

     resetToken: String,
     resetTokenExpiration: Date,

     cart: {
          items: [
               {
                    //10월5일: of course you only need this when using references, when using embedded documents as we do with the cart.
                    productId:{type:Schema.Types.ObjectId, ref: 'Product', required: true},
                    quantity:{type: Number, required: true}
               }
          ]
     }
});


//10월6일 : 몽구스 스키마에 method를 추가 하는 방법이다.  this는 스키마를 가르킨다. 
userSchema.methods.addToCart = function(product) {
          const cartProductIndex = this.cart.items.findIndex(cp => {
                         return cp.productId.toString() === product._id.toString();
                    });
                 
          //const updatedCart = {items: [{...product, quantity: 1 }]};
          //u-197 추가
          //we want to be able to store multiple products in there and increase the quantity in case we already do have a product in there. So we need to fine tune our code a little bit and we already started. 

          let newQuantity = 1;

          //💇‍♀️10월 4일 the existing elements with the spread operator with the three dots.  해당 사용자에게 cart item들을 추가하는 것이다. items가 없는 경우는 [] 가 되지만 updatedCartItems.push() 메소드를 이용해서 새롭게 저장이 된다. 이것이 nosql의 특징이다. 

          const updatedCartItems = [...this.cart.items];
          
          
          if(cartProductIndex >=0) {
               //cartProduct가 이미 존재를 하면
               newQuantity = this.cart.items[cartProductIndex].quantity + 1;
               updatedCartItems[cartProductIndex].quantity = newQuantity
          }
          else{

               //10월4일 : 새로운 addcart 인경우 product id를 cart 에 저장을 해서 지정을 한다. 
               updatedCartItems.push({productId: product._id, quantity: newQuantity});
          }

          const updatedCart = {
               items: updatedCartItems
          };
          
          this.cart = updatedCart;
          return this.save()
};

userSchema.methods.removeFromCart = function(productId) {

     //여기서 필터링을 해 버린다. 
     const updatedCartItems = this.cart.items.filter(item => {
                      return item.productId.toString() !== productId.toString();
                  });
     this.cart.items = updatedCartItems;
     return this.save();
}

userSchema.methods.clearCart = function() {
     this.cart = {items:[]};
     return this.save();

}

module.exports = mongoose.model('User', userSchema);

//should own a cart and that cart will hold multiple products.
//this is how we can then overall connect everything
//I'll add a user.js file in the models folder and in there first of all. let's define a user model.

//one thing I want to start using it for is what I want to create an association.
// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User {
//     constructor(username, email, cart,id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart;       //{items: []} 으로 정의를 한다. 
//         this._id = id;
//     }
//     save(){
//         const db = getDb();
//         return db.collection('users').insertOne(this);
        
//     }

//     addToCart(product) {
//         //여기서 cart는 {items:[]} 이다. 
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });
       
//         //const updatedCart = {items: [{...product, quantity: 1 }]};
//         //u-197 추가
//         //we want to be able to store multiple products in there and increase the quantity in case we already do have a product in there. So we need to fine tune our code a little bit and we already started. 

//         let newQuantity = 1;

//         //💇‍♀️10월 4일 the existing elements with the spread operator with the three dots.  해당 사용자에게 cart item들을 추가하는 것이다. items가 없는 경우는 [] 가 되지만 updatedCartItems.push() 메소드를 이용해서 새롭게 저장이 된다. 이것이 nosql의 특징이다. 

//         const updatedCartItems = [...this.cart.items];
        
        
//         if(cartProductIndex >=0) {
//             //cartProduct가 이미 존재를 하면
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity
//         }
//         else{

//             //10월4일 : 새로운 addcart 인경우 product id를 cart 에 저장을 해서 지정을 한다. 
//             updatedCartItems.push({productId: new ObjectId(product._id), quantity: newQuantity});
//         }

//         const updatedCart = {
//             items: updatedCartItems
//         };
//         const db = getDb();
//         return db
//             .collection('user')
//             .updateOne(
//                 {_id: new ObjectId(this._id)},
//                 {$set:{cart: updatedCart}}
//         );

//     }

//     getCart() {

//         //10월4일: a cart with all the products details which we also require, And to do this
//         //there I want to find all products that are in my cart
//         const db = getDb();
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         });
//         return db
//                 .collection('products')

//                 //💇‍♀️10월 4일: special mongodb query operators which there ar many covered in detail 
//                 //$in operator: this operator takes an array of IDs  and therefore every ID which is in the array will be accepted and will get back a cursor which holds reference to all products with one of the IDs mentioned in this array. 찾고자 하는 productId의 어레이를 만들어서 넣어준다. 
//                 .find({_id: {$in: productIds}})
//                 .toArray()
//                 .then(products => { 
//                     return products.map(p => {

//                         //💇‍♀️10월4일 :여기서 p는 product이고 ...p는 스프트리트이고 element를 가져오고, 그리고 해당되는 quantity를 찾아서 넣어주면 된다. 결국은 object를 새로이 생성을 해 주는 것이다. 
//                         return{
//                             ...p,
//                             quantity:this.cart.items.find(i => {
//                                 return i.productId.toString() === p._id.toString();
//                             }).quantity
//                         };
//                 }); 
//             })   

//     }

//     deleteItemFromCart(productId) {
//         const updatedCartItems = this.cart.items.filter(item => {
//             return item.productId.toString() !== productId.toString();
//         });
        
//         const db = getDb();
//         return db
//             .collection('user')
//             .updateOne(
//                 {_id: new ObjectId(this._id)},
//                 {$set:{cart: {items: updatedCartItems}}}
//         );
//     }

//     addOrder() {
//         const db =getDb();
//         return this.getCart().then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: new ObjectId(this._id),
//                     name: this.name
//                 }
//             };
//             return db.collection('orders').insertOne(order);
//         })
        
//         .then(result => {
//             this.cart = {items: []};

//             //💇‍♀️10월 4일:user의 cart를 비워주게 된다. 왜냐하면 order로 cart가 이동을 했기 때문이다. 
//             return db
//             .collection('user')
//             .updateOne(
//                 {_id: new ObjectId(this._id)},
//                 {$set:{cart: {items: []}}}
//         );
//         });
//     }

//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({'user._id': new ObjectId(this._id)}).toArray();

//     }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('user')
//         .findOne({_id: new ObjectId(userId)})
//         .then(user => {
//             console.log(user);
//             return user;
//         })
//         .catch(err => console.log(err));


//     }
// }

//  module.exports = User;