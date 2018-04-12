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

// 상품 등록
exports.register = function(req, res, sellerCookie) {
    var sellerId;
    var name = req.body.name;
    var description = req.body.description; 
    var price = req.body.price;
    var picture = req.body.picture;

    var selectQuery = "SELECT * FROM SELLERS WHERE email=?";
    var selectQueryParams = [sellerCookie];

    //sellerId 구하기.
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
            sellerId = result[0].id;

            var insertQuery = "INSERT INTO `PRODUCTS` (seller_id,picture) VALUES (?,?)";

            var insertQueryParams = [sellerId, picture];
            con.query(insertQuery, insertQueryParams, function(err2, result2, field2) {
                if (err) {
                    response = makeResponse(0, "상품등록 쿼리문 오류", {});
                    res.json(response);
                    return;
                } else {
                    var requestJsonData = {
                        "$class": "org.acme.ling.Product",
                        "ID": "PRODUCT_" + result2.insertId,
                        "sellerId": sellerId,
                        "name": name,
                        "description": description,
                        "price": parseFloat(price)
                    }

                    var options = {
                        url: REST_API_ADDRESS + 'Product',
                        method: 'POST',
                        json: requestJsonData
                    };

                    request(options, function(error, reqResponse, body) {
                        if (!error && reqResponse.statusCode == 200) {
                            // 블록체인에도 데이터 넣기 성공하면 
                            response = makeResponse(1, "모든 로직이 정상처리 되었습니다.", { "participant": "seller" });
                            res.json(response);
                        } else {
                            response = makeResponse(0, "DB에 데이터 넣기는 성공하였으나 블록체인에 접근실패", {});
                            res.json(response);
                        }

                    });

                }
            });
        }
    });
}


exports.showProductDetail = function(req, res) {

    var id = req.body.id;
    var seller_id = req.body.seller_id;

    //블록체인에 있는 데이터를 검색해서 준다.
    var url = REST_API_ADDRESS + "Product/PRODUCT_" + id;
    console.log(url);
    request(url, function(error, reqResponse, body) {
        var productData = JSON.parse(body);
        console.log(productData);

        res.render('product_detail.html', { "productData": productData });
    });
}


// 전체 상품 보기
exports.showAllProducts = function(req, res) {

    var selectQuery = "SELECT * FROM PRODUCTS";
    con.query(selectQuery, function(err, result, field) {
        if (err) {
            response = makeResponse(0, "잘못된 쿼리문입니다.", {});
            res.json(response);
            return;
        }
        res.render('show_all_products.html', { 'products': result });
    });
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