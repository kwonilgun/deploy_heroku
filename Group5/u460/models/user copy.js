//should own a cart and that cart will hold multiple products.
//this is how we can then overall connect everything
//I'll add a user.js file in the models folder and in there first of all. let's define a user model.

//one thing I want to start using it for is what I want to create an association.
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;

class User {
    constructor(username, email, cart,id) {
        this.name = username;
        this.email = email;
        this.cart = cart;       //{items: []} 으로 정의를 한다. 
        this._id = id;
    }
    save(){
        const db = getDb();
        return db.collection('users').insertOne(this);
        
    }

    addToCart(product) {
        //여기서 cart는 {items:[]} 이다. 
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
            updatedCartItems.push({productId: new ObjectId(product._id), quantity: newQuantity});
        }

        const updatedCart = {
            items: updatedCartItems
        };
        const db = getDb();
        return db
            .collection('user')
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set:{cart: updatedCart}}
        );

    }

    getCart() {

        //10월4일: a cart with all the products details which we also require, And to do this
        //there I want to find all products that are in my cart
        const db = getDb();
        const productIds = this.cart.items.map(i => {
            return i.productId;
        });
        return db
                .collection('products')

                //💇‍♀️10월 4일: special mongodb query operators which there ar many covered in detail 
                //$in operator: this operator takes an array of IDs  and therefore every ID which is in the array will be accepted and will get back a cursor which holds reference to all products with one of the IDs mentioned in this array. 찾고자 하는 productId의 어레이를 만들어서 넣어준다. 
                .find({_id: {$in: productIds}})
                .toArray()
                .then(products => { 
                    return products.map(p => {

                        //💇‍♀️10월4일 :여기서 p는 product이고 ...p는 스프트리트이고 element를 가져오고, 그리고 해당되는 quantity를 찾아서 넣어주면 된다. 결국은 object를 새로이 생성을 해 주는 것이다. 
                        return{
                            ...p,
                            quantity:this.cart.items.find(i => {
                                return i.productId.toString() === p._id.toString();
                            }).quantity
                        };
                }); 
            })   

    }

    deleteItemFromCart(productId) {
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString();
        });
        
        const db = getDb();
        return db
            .collection('user')
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set:{cart: {items: updatedCartItems}}}
        );
    }

    addOrder() {
        const db =getDb();
        const order = {
            items: this.cart.items,
            user: {
                _id: new ObjectId(this._id),
                name: this.name
            }
        };
        return db.collection('order').insertOne(this.cart).then(result => {
            this.cart = {items: []};
            return db
            .collection('user')
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set:{cart: {items: []}}}
        );
        });
    }

    getOrders() {
        const db = getDb();

    }

    static findById(userId) {
        const db = getDb();
        return db.collection('user')
        .findOne({_id: new ObjectId(userId)})
        .then(user => {
            console.log(user);
            return user;
        })
        .catch(err => console.log(err));


    }
}

 module.exports = User;