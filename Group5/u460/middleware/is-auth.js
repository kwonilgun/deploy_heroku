

//10월10일 미들웨어 함수이다. : because otherwise I want to allow the request to continue to whichever route the request wanted to go,  
module.exports = (req, res, next) => {
     
     if(!req.session.isLoggedIn) {
          console.log('is-auth.js: 로그인 안된 상태 임...')
          return res.redirect('/login');
     }
     next();
}