

//express router

const express = require('express');

//10월 17일: 
const { check, body } = require('express-validator');  //check 함수를 가져온다. 

const authController = require('../controllers/auth');
const User = require('../models/user');


const router = express.Router();

router.get('/login', authController.getLogin);

//10월10일 sign up 을 추가함
router.get('/signup', authController.getSignup);
router.post('/login',
     [
          body('email')
               .isEmail()
               .withMessage('Please enter a valid email address')
               .normalizeEmail(),
          body('password', 'Password has to be valid')
               .isLength({min: 4})
               .isAlphanumeric()
               .trim()


     ],
     authController.postLogin);

router.post('/logout', authController.postLogout);

//10월 10일 signup을 추가
//10월17일: I can check email, Now this tell this middleware, the express validator that I am interested in confirming that e-mail value or that I am interested in validating that value, we then call a method and this will in the end then return a middleware that is understood by expressjs
//Now there are way more built-in validators available form which you can choose and you will find them 
router.post(
     '/signup',
     [
          check('email')
               .isEmail()
               .withMessage('Please enter a valid email.')
               .custom((value, { req }) => {
                    // if(value === 'test@test.com') {
                    //      throw new Error('This email address is forbidden');
                    // }
                    // return true;
                    return User.findOne({ email: value })
                         .then(userDoc => {
                              if (userDoc) {

                                   //여기가 asynchrous validation이다. 
                                   return Promise.reject('Email exists already, please pick a different one');
                              }
                         });
               })
               .normalizeEmail(),
          body(
               'password',
               'Please enter a password with only numbers and text and at least 5 characters.'
          )
               .isLength({ min: 5 })
               .isAlphanumeric()
               .trim(),

          //req에서 값을 가져온다.
          body('confirmPassword').trim().custom((value, { req }) => {
               if (value !== req.body.password) {
                    throw new Error('Password have to match');
               }
               return true;
          })
     ],

     authController.postSignup
);

//10월 12일 추가
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);


module.exports = router;