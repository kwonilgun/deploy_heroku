

const cart = {"products":[{"id":"123245","qty":1},{"id":"0.9966356882291261","qty":1}],"totalPrice":30};

console.log("cartTest.js");

function addProduct(id, productPrice) {
     const existingProductIndex = cart.products.findIndex(prod => prod.id === id);

     console.log('existingProductIndex= ' + existingProductIndex);
     
     const existingProduct = cart.products[existingProductIndex];

     console.log(existingProduct);
                    
     let updatedProduct;

     if(existingProduct) {
          updatedProduct = {...existingProduct};
          console.log( updatedProduct)
          updatedProduct.qty = updatedProduct.qty + 1;
          cart.products = [...cart.products];
          console.log( cart.products);
          cart.products[existingProductIndex] = updatedProduct;

     }
     else{
          updatedProduct = {id: id, qty:1 };
          cart.products = [...cart.products, updatedProduct]
          console.log(cart.products);
          
     }
}

addProduct("0.9966356882291261", 19);