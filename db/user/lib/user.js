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

//유저 회원가입
exports.register = function(req, res) {

    var email = req.body.email;
    var password = getSecretPassword(req.body.password);
    var name = req.body.name;
    var phone = req.body.phone;
    var address = req.body.address;
    var dateOfBirth = req.body.date_of_birth;

    var insertQuery = "INSERT INTO `USERS` (email,name,phone,password,address,date_of_birth) VALUES (?,?,?,?,?,?)";

    var insertQueryParams = [email, name, phone, password, address, dateOfBirth];
    console.log(insertQueryParams);
    con.query(insertQuery, insertQueryParams, function(err, result, field) {
        if (err) {
            response = makeResponse(0, "주문등록 쿼리문 오류", {});
            res.json(response);
            return;
        } else {
            var requestJsonData = {
                "$class": "org.acme.ling.User",
                "ID": "USER_" + result.insertId,
            }

            var options = {
                url: REST_API_ADDRESS + 'User',
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

// 유저 로그인
exports.login = function(req, res) {

    var email = req.body.email;
    var password = getSecretPassword(req.body.password);

    var selectQuery = "SELECT * FROM USERS WHERE email=?";
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
exports.userMyPage = function(req, res, myCookie) {

    // 쿠키에 해당하는 이메일이 DB에 있는지 확인한다.
    var validationCookie = myCookie.email;

    var selectQuery = "SELECT * FROM USERS WHERE email=?";
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
            // 성공시 이 쿠키에 해당하는 유저의 보증서만 보여준다.
            var userId = result[0].id;

            var selectQuery2 = "SELECT * FROM WARRANTYS WHERE buyer_id=?";
            var selectQueryParams2 = [userId];
            con.query(selectQuery2, selectQueryParams2, function(err2, result2, field2) {
                if (err2) {
                    response = makeResponse(0, "잘못된 쿼리문입니다.", {});
                    res.json(response);
                    return;
                }
                if (result.length == '0') {
                    response = makeResponse(0, "잘못된 유저입니다.", {});
                    res.json(response);
                    return;
                } else {
                    console.log(result2);
                    res.render('user_my_page.html', { "warrantys": result2 });
                }

            });
        }
    });
}


exports.existCookie = function(req, res, cookies) {

    // 쿠키에 해당하는 이메일이 DB에 있는지 확인한다.
    var selectQuery = "SELECT * FROM USERS WHERE email=?";
    var selectQueryParams = [cookies];
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
            response = makeResponse(1, "사용자 쿠키 존재", {});
            res.json(response);
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