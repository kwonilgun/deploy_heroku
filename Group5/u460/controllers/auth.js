

const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const User = require('../models/user');
const nodemailer = require('nodemailer');

//10월17일: validationResult will be a function that allows us to gather all the errors prior validation middleware like this one might have thrown or might have stored. 
const {validationResult} = require('express-validator');

//10월11일: mailtrap.io를 이용해서 메일을 보낸다. 
const email = {
  "host" : "smtp.mailtrap.io",
  "port" : 2525,
  "secure": false,
  "auth": {
    "user": "21194a3cee1f85",
    "pass": "fd78ddffe11afc"
  }

}

const send = async (data) => {
  nodemailer.createTransport(email).sendMail(data, (error, info) =>{
    if(error) {
      console.log(error);
    } else {
      console.log(info);
      return info.response;
    }

  });
};


exports.getLogin = (req, res, next) => {
    console.log('export.getLogin, cookies');
  
    let message = req.flash('error');

    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
      
    console.log("exports.getLogin");
    res.render('auth/login', {
             path: '/login',
             pageTitle: 'Login',

             //10월11일 : So now error message will be set and will hold a value only if we have an error flashed into our session. 
             errorMessage: message,
             oldInput: {
              email: '',
              password: ''
            },
             validationErrors: []

          //  isAuthenticated: false : 이미 로컬에 포함이 되어있다. app.js의 미들웨어
          //    orders: orders
    }); 
};

exports.getSignup = (req, res, next) => {
  console.log('export.getSignup');

  let message = req.flash('error');

  if(message.length > 0) {
      message = message[0];
  } else {
      message = null;
  }
  
  res.render('auth/signup', {
           path: '/signup',
           pageTitle: 'Signup',
           errorMessage: message,
           oldInput: {
            email: "",
            password: "",
            confirmPassword:""
           },
           validationErrors: []

          //  isAuthenticated: false : 이미 로컬에 포함이 되어있다. app.js의 미들웨어
        //    orders: orders
  }); 
};

exports.postSignup = (req, res, next) => {
  
  console.log('exports.postSignup');
  const email = req.body.email;
  const password = req.body.password;
  // const confirmPassword = req.body.confirmPassword;

  //10월17일: I can now simply extract my errors and store them 
  //middleware route auth.js에서 router.post('/signup', check('email').isEmail, authController.postSignup); 한 결과를 여기서 확인한다. 

  const errors = validationResult(req); 

  if(!errors.isEmpty()) {
    //it will send a response just with thi different status code and then we can call
    console.log(errors.array())
    return res.status(422).render(
      'auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, password: password, confirmPassword: req.body.confirmPassword},
      validationErrors: errors.array()

     
    } );
  }
  

  //10월10일: validate email, password: I will have a complete module where I dive into how to validate user input because. For example we would check is this a valid email address and do password and confirm password match

  //사인업을 여기서 한다. 이미 사용자가 존재하면 login 화면으로 간다. 

  // User.findOne({email: email})
  //   .then(userDoc => {
  //     if(userDoc) {
  //       //같은 이메일 사용자가 존재하면
  //         req.flash('error','Email exists already, please pick a different one');
  //         return res.redirect('/signup');
  //     }
  //     //없으면
      bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            //10월 8일 :보안이슈가 있다. 해싱을 위해서 패키지를 설치해야 한다. npm install --save bcryptjs
            password: hashedPassword,
            cart: {items: []}
          });

          //데이타 베이스에 저장을 한다. 
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
          send({
            from:'shop@node-complete.com',
            to: 'e933426a01-3d64b1@inbox.mailtrap.io',
            subject: 'signup succeeded',
            text:'signup 성공함'
          })

          
        })
      .catch(err => {
        console.log(err);
      });

}


exports.postLogin = (req, res, next) => {

    console.log('exports.postLogin');
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errors.array()[0].msg,
        oldInput: {
          email: email,
          password: password
        },
        validationErrors: errors.array()
       });     
    }

   
  //10월10일: 로그인이 성공이 되면 여기서 세션이 생성이 된다. 그리고 시작이 된다. 
  //  User.findById("63410004c43f2c642407d846")
  User.findOne({email: email})
    .then(user => {  //여기서 해당 유저를 가져온다. 
      if(!user) {

        console.log("이메일 틀림");

        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcrypt.compare(password, user.password)
        .then(doMatch => {  //doMatch는 불리언이다. 
            if(doMatch) {
                console.log("로그인 성공")
                req.session.isLoggedIn = true;
                req.session.user = user

                //여기서 세션을 저장을 한다. 로그인이 성공을 하면 세션을 생성을 한다. 
                return req.session.save(err => {
                  console.log(err);
                  res.redirect('/');
                })
                
            }
            console.log("패스워드 틀림");
            //패스워드가 맞지 않는 경우
            //10월 11일 추가
            req.flash('error','invalid email or password');

            res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })
      
      
    })
    .catch(err => console.log(err));
    
};


  


exports.postLogout = (req, res, next) => {

    console.log('exports.postLogout');
    req.session.destroy((err) =>{
      console.log(err);
      res.redirect('/');
    });

   
};


//10월 12일: password reset 
exports.getReset = (req, res, next) => {
  
  console.log('export.getRest: 패스워드 리셋')

  let message = req.flash('error');

  if(message.length > 0) {
      message = message[0];
  } else {
      message = null;
  }

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset password',
    errorMessage: message
   //  isAuthenticated: false : 이미 로컬에 포함이 되어있다. app.js의 미들웨어
 //    orders: orders
  }); 
};

exports.postReset = (req, res, next) => {

    crypto.randomBytes(32, (err, buffer) => {
      if(err) {
        console.log(err);
        return res.redirect('/reset');
      }

      const token = buffer.toString('hex');
      User.findOne({email: req.body.email})
        .then(user => {

          //10월12일: user token과 expiration을 세팅한다. 
          if(!user) {
            req.flash('error', 'No account with that mail found.');
            return res.redirect('/reset');
          }
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save();
        })
        .then(result => {
          console.log('exports.postReset: password reset')
          res.redirect('/');
          send({
            from:'shop@node-complete.com',
            to: 'e933426a01-3d64b1@inbox.mailtrap.io',
            subject: 'Password reset',
            html:` <p>You required a password reset.</p>
                 <p> Click this <a href="http://localhost:3001/reset/${token}">link </a>to set a new password.`
                  
          });
        })
        .catch(err => console.log(err));

    });
};


exports.getNewPassword = (req, res, next) => {

  console.log('export.getNewPassword')

  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
      let message = req.flash('error');

      if(message.length > 0) {
          message = message[0];
      } else {
          message = null;
      }

      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token

       //  isAuthenticated: false : 이미 로컬에 포함이 되어있다. app.js의 미들웨어
     //    orders: orders
      }); 
    })
    .catch(err => console.log(err));
}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  console.log('exports.postNewPassword');

  User.findOne({
    resetToken: passwordToken, 
    resetTokenExpiration: {$gt: Date.now()},
    _id: userId 
  })
  .then(user => {
    resetUser = user;
    return bcrypt.hash(newPassword, 12);
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  })
  .then(result => {
    console.log('패스워드 리셋 성공');
    res.redirect('/login');
  })
  .catch(err => console.log(err));


};