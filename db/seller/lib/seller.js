// crypto!!
const crypto = require('crypto');

//요청 페이지의 내용을 받아온다.
var request = require('request');

// mysql
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "ling"
});

var REST_API_ADDRESS = 'http://192.168.40.80:3000/api/';

// 판매자 회원가입
exports.register = function(req, res) {

    var email = req.body.email;
    var password = getSecretPassword(req.body.password);
    var name = req.body.name;
    var phone = req.body.phone;
    var webSite = req.body.web_site;

    var insertQuery = "INSERT INTO `SELLERS` (email,password,phone,name,web_site) VALUES (?,?,?,?,?)";
    var insertQueryParams = [email, password, phone, name, webSite];

    con.query(insertQuery, insertQueryParams, function(err, result, field) {
        if (err) {
            response = makeResponse(0, "주문등록 쿼리문 오류", {});
            res.json(response);
            return;
        } else {
            var requestJsonData = {
                "$class": "org.acme.ling.Seller",
                "ID": "SELLER_" + result.insertId,
            }

            var options = {
                url: REST_API_ADDRESS + 'Seller',
                method: 'POST',
                json: requestJsonData
            };

            request(options, function(error, reqResponse, body) {
                if (!error && reqResponse.statusCode == 200) {
                    // 블록체인에도 데이터 넣기 성공하면 
                    response = makeResponse(1, "모든 로직이 정상처리 되었습니다.", {});
                    res.json(response);
                } else {
                    response = makeResponse(0, "DB에 데이터 넣기는 성공하였으나 블록체인에 접근실패", {});
                    res.json(response);
                }

            });

        }
    });
}

// 로그인되어있는지 , 쿠키 확인 
exports.isLogined = function(req, res, next) {
    if (req.signedCookies.email === undefined) {
        res.redirect('/');
    } else {
        next();
    }
}

// 판매자 로그인
exports.login = function(req, res) {

    var email = req.body.email;
    var password = getSecretPassword(req.body.password);

    var selectQuery = "SELECT * FROM SELLERS WHERE email=?";
    var selectQueryParams = [email];

    // email이 먼저 있는지 확인한다.
    con.query(selectQuery, selectQueryParams, function(err, result, field) {
        if (err) {
            response = makeResponse(0, "잘못된 쿼리문입니다.", {});
            res.json(response);
            return;
        }
        if (result.length == '0') {
            response = makeResponse(0, "없는 아이디 입니다.", {});
            res.json(response);
            return;
        } else if (result.length == 1) {
            if (result[0].password === password) {

                // 여기서 쿠키 심어야 할듯
                res.cookie('email', email, { signed: true });

                response = makeResponse(1, "로그인 성공", {});
                res.json(response);
                return;
            } else {
                response = makeResponse(0, "비밀번호가 틀렸습니다.", {});
                res.json(response);
                return;
            }
        }

    });
}

// myPage
exports.sellerMyPage = function(req, res, myCookie) {

    // 쿠키에 해당하는 이메일이 DB에 있는지 확인한다.
    var validationCookie = myCookie.email;

    var selectQuery = "SELECT * FROM SELLERS WHERE email=?";
    var selectQueryParams = [validationCookie];

    con.query(selectQuery, selectQueryParams, function(err, result, field) {
        if (err) {
            response = makeResponse(0, "잘못된 쿼리문입니다.", {});
            res.json(response);
            return;
        }
        if (result.length == '0') {
            response = makeResponse(0, "잘못된 쿠키입니다.", {});
            res.json(response);
            return;
        } else {
            // 성공시 상품 등록 페이지와, 자신이 등록한 상품과 보증서만 볼 수 있게 해준다.
            var sellerId = result[0].id;
            var selectQuery = "SELECT * FROM PRODUCTS WHERE seller_id=?";
            var selectQueryParams = [sellerId];
            con.query(selectQuery, selectQueryParams, function(err2, result2, field2) {

                var selectQuery2 = "SELECT * FROM WARRANTYS WHERE seller_id=?";
                var selectQueryParams2 = [sellerId];
                con.query(selectQuery2, selectQueryParams2, function(err3, result3, field3) {
                    console.log(result3);
                    res.render('seller_my_page.html', { "products": result2, "warrantys": result3 });
                });
            });

        }
    });
}


//패스워드 암호화 함수
function getSecretPassword(password) {
    var cipher = crypto.createCipher('aes-256-cbc', '열쇠');
    var secretPassword = cipher.update(password, 'utf8', 'base64');
    return secretPassword + cipher.final('base64');
}

// 리스폰스 만드는 함수
function makeResponse(status, message, data) {
    var response = {
        status: status,
        message: message
    };

    for (var key in data) {
        response[key] = data[key];
    }
    return response;
}