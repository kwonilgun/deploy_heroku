const path = require("path");
const fs = require("fs");
const https = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const csrf = require("csurf");

const errorController = require("./controllers/error");
const User = require("./models/user");
const flash = require("connect-flash");

//10월18일:
const multer = require("multer");

//11월 9일:
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

//11월 9일: we can access environment variables on the process object, this is an object not defined by us. this is globally available in the node app, it's part of the node code runtime. 환경변수를 사용한다. 여기에는 디폴트 환경변수가 있다.

// const MONGODB_URI = "mongodb+srv://kwon:thwls8404@cluster0.fcofe8x.mongodb.net/shop";
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.fcofe8x.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

//9월22일: sequelize 추가
// const sequelize = require('./util/database');
// const Product = require('./models/product');
// const User = require('./models/user');
// const Cart = require('./models/cart');
// const CartItem = require('./models/cart-item');

const app = express();

//constructor
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

//csrf를 초기화 한다.
const csrfProtection = csrf();

// heroku에서는 필요가 없다. 
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

//diskStroage is a storage engine which you can use with multer and there you can pass a javascript object to configure that. it takes two keys, it takes the destination and it takes file name.
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); //true: 저장을 한다.
  } else {
    cb(null.false); //false: 저장을 하지 않는다.
  }
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

//11월 9일:
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

const { userInfo } = require("os");

//10월19일: url encoded parser 이다. url encoded data is basically text data.
app.use(bodyParser.urlencoded({ extended: false }));

//10월18일: 이미지 파일 처리를 위해서,
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(express.static(path.join(__dirname, "public")));

//10월19일: 이미지 처리를 위해서
app.use("/images", express.static(path.join(__dirname, "images")));

//10월 7일 - we pass session and we execute this as a function and to the function, we pass a js object where we configure the session setup. secret: this will be used for signing the hash which secretly stores ourID in the cookie. 쿠기에 저장할 때 암호를 건다.  resave: this means that the session will not be saved on every request that is done, so on every response that is sent. but only if something changed in the session, this will obviously improve performance and so on. Also there is the save unintialized value which you should set to false

//10월9일: we fetched that user for every request in the middleware in app.js, so we fetch the user from the database and mongoose automatically gave us a full user object not just the data in the database but the full user model with all the methods and we storeed that user model in the request, with the session this works a bit different, With the session we are not fetching this for every request instead we store the user in our session upon logging in here. Now for every request, the session middleware does not go ahead and fetch the user with the help of mongoose, it fetches the session data from mongodb. that is correct but for that, it uses the mongodb store and the mongodb store does not know about our  mongoose models. So when it fetches the data from the session database, when it fetches this data, it only fetched the data. it does not fetch an object with all the modules provided by mongoose
//one thing we can do and now we are reverting back a bit, we can re-add that middleware which we had earlier here after we initialize our session.
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store, //MongoDB store이다.
  })
);

//csrf middleware
//csrf protection is generally enabled but we still need to add something to our views to really user it
app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
  //So now for every request that is executed, these two fields will be set for the views that are rendered
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//Now this means that now we just want to use that session data to load our real user, to create our mongoose user model and how do we do that?
//mongoose methods work again.몽구스 함수를 다시 동작하게 만든다.
app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      // console.log(err)
      //10월 18일: 비동기에서 에러를 발생하는 것은 next() 안에서 처리를 해 주어야 한다.
      next(new Error(err));
    });
});

//a special field on the response, local field. locals, this allows to set local variables that are passed into the views, local simply because well they will only exist in the views which are rendered. 로컬 변수는 뷰가 그려질 때 존재한다 .

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

//10월18일: 에러 처리 전용 미들웨어 . central error handling middleware
app.use((error, req, res, next) => {
  // res.redirect('500');
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    //console.log(result);
    //10월5일: 사용자가 없으면 새로 생성을 하고, 있으면 skip 한다.
    // User.findOne().then(user => {
    //      if(!user) {
    //           const user = new User({
    //                name: 'Max',
    //                email: 'max@test.com',
    //                cart: {
    //                     items:[]
    //                }
    //           });
    //           user.save()
    //      }
    // });
//     https
//       .createServer({ key: privateKey, cert: certificate }, app)
      app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
