// fileSystem
var fs = require('fs');

// user DB모듈  
var userDB = require('./db/user');

// seller DB모듈  
var sellerDB = require('./db/seller');

// product DB모듈  
var productDB = require('./db/product');

// warranty DB모듈  
var warrantyDB = require('./db/warranty');





// express
var express = require('express'),
    path = require("path"),
    app = express(),
    fileUpload = require('express-fileupload');

//파일 업로더
app.use(fileUpload());

//static폴더
app.use(express.static(path.join(__dirname, "/public")))
app.use(express.static('js/lib'));

//ejs 렌더링
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//body-parser
var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

var cookie = require('cookie-parser');
app.use(cookie('!@#%%@#@'));


//첫 화면
app.get('/', function(req, res) {
    res.render('index.html');
});

// 유저 회원가입
app.post("/userRegister", function(req, res) {
    userDB.register(req, res);
});

// 유저 로그인 페이지
app.get('/userLoginPage', function(req, res) {
    var cookies = req.signedCookies.email;
    if (req.signedCookies.email === undefined) {
        res.render('userLogin.html');
    } else {
        res.redirect('/userMyPage')
    }
})

// 유저 로그인
app.post("/userLogin", function(req, res) {
    userDB.login(req, res);
});

// 유저 로그아웃
app.get('/userLogout', function(req, res) {
    res.clearCookie("email");
    res.redirect('/');
})


// 유저 myPage
app.get('/userMyPage', function(req, res) {
    var myCookie = req.signedCookies;
    userDB.userMyPage(req, res, myCookie);
});


// 판매자 회원가입
app.post("/sellerRegister", function(req, res) {
    sellerDB.register(req, res);
});

// 판매자 로그인 페이지
app.get('/sellerLoginPage', function(req, res) {
    var cookies = req.signedCookies.email;
    if (req.signedCookies.email === undefined) {
        res.render('sellerLogin.html');
    } else {
        res.redirect('/sellerMyPage')
    }
})


// 판매자 로그인
app.post("/sellerLogin", function(req, res) {
    sellerDB.login(req, res);
});

// 판매자 myPage
app.get('/sellerMyPage', function(req, res) {
    var myCookie = req.signedCookies;
    sellerDB.sellerMyPage(req, res, myCookie);
});

// 판매자 로그아웃
app.get('/sellerLogout', function(req, res) {
    res.clearCookie("email");
    res.redirect('/');
})


// 상품 등록 
app.post("/productRegister", function(req, res) {
    var myCookie = req.signedCookies;
    productDB.register(req, res, myCookie.email);
});

// 상품 상세내용 보기
app.post("/showProductDetail", function(req, res) {
    productDB.showProductDetail(req, res);
});

// 전체상품 보기(사용자용)
app.get("/showAllProducts", function(req, res) {
    productDB.showAllProducts(req, res);
});

// 상품 구매(사용자용)
app.post("/buyProduct", function(req, res) {
    var userCookie = req.signedCookies.email;
    warrantyDB.register(req, res, userCookie);
});


// 보증서 내용 상세보기
app.post("/showWarrantyDetail", function(req, res) {
    warrantyDB.showWarrantyDetail(req, res);
});

app.listen(3000, function() {
    console.log("Server listening on http://localhost:3000");
});