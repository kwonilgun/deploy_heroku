

//10월20일: this is javascript code that will now not run on the server but that will run in the client, so in the browser. I will import this javscript file into my products page here. products.ejs 

const deleteProduct = (btn) => {
     //console.log(btn);
     const prodId = btn.parentNode.querySelector('[name=productId').value;
     const csrf = btn.parentNode.querySelector('[name=_csrf').value;

     //Here we can use the fetch method which is a method supported by the browser for sending http rquests and it's not just for fetching data as the name might suggest, it's also for sending data. Here if you can pass a url, so we want to send a request to /product 즉 url을 서버에 보내는 메소드이다. request body를 추가할 수 있다. 

     const productElement = btn.closest('article');

     fetch('/admin/product/' + prodId, {
          method: 'DELETE',
          headers: {
               'csrf-token': csrf
          }
     })
     .then(result => {
          console.log(result);
          productElement.parentNode.removeChild(productElement);
     })
     .catch(err => {
          console.log(err);
     });

};