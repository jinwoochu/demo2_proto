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

var REST_API_ADDRESS = 'http://192.168.192.34:3000/api/';

// 보증서 등록
exports.register = function(req, res, userCookie) {

    var productId = req.body.id; // 제품 식별번호
    var sellerId = req.body.sellerId; // 판매자 식별번호
    var userId; // 사용자 식별번호는 구해야됨.

    var selectQuery = "SELECT * FROM USERS WHERE email=?";
    var selectQueryParams = [userCookie];

    //userId 구하기.
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
        }
        userId = result[0].id;

        // 상품번호에 해당하는 상품정보 가져오기.        
        // 블록체인에 있는 데이터를 검색해서 준다.
        var url = REST_API_ADDRESS + "Product/PRODUCT_" + productId;
        request(url, function(error, reqResponse, body) {
            var productData = JSON.parse(body);
            var nowTime = new Date();

            //seller website 구하기.
            var selectQuery2 = "SELECT web_site FROM SELLERS WHERE id=?";
            var selectQueryParams2 = [sellerId];

            con.query(selectQuery2, selectQueryParams2, function(err2, result2, field2) {
                if (err2) {
                    response = makeResponse(0, "잘못된 쿼리문입니다.", {});
                    res.json(response);
                    return;
                }
                if (result2.length == '0') {
                    response = makeResponse(0, "잘못된 판매자입니다.", {});
                    res.json(response);
                    return;
                }
                // console.log(result2[0].web_site)
                var insertQuery = "INSERT INTO `WARRANTYS` (seller_id,product_id,buyer_id) VALUES (?,?,?)";

                var insertQueryParams = [sellerId, productId, userId];
                con.query(insertQuery, insertQueryParams, function(err3, result3, field3) {
                    if (err3) {
                        response = makeResponse(0, "보증서등록 쿼리문 오류", {});
                        res.json(response);
                        return;
                    } else {
                        var requestJsonData = {
                            "$class": "org.acme.ling.Warranty",
                            "ID": "WARRANTY_" + result3.insertId,
                            "sellerId": sellerId,
                            "productId": productId,
                            "userId": userId,
                            "serialNumber": "111-222-333-444",
                            "productName": productData.name,
                            "price": productData.price,
                            "purchaseDay": nowTime.toJSON(),
                            "store": result2[0].web_site, // seller의 웹사이트
                            "seller": sellerId,
                            "ExpireDay": new Date(Date.parse(nowTime) + 365 * 1000 * 60 * 60 * 24),
                            "warrantyContents": "this warranty will expire after 1 year"
                        }

                        var options = {
                            url: REST_API_ADDRESS + 'Warranty',
                            method: 'POST',
                            json: requestJsonData
                        };

                        request(options, function(error, reqResponse, body) {
                            if (!error && reqResponse.statusCode == 200) {
                                // 블록체인에도 데이터 넣기 성공하면 
                                res.redirect('/userMyPage');
                            } else {
                                response = makeResponse(0, "DB에 데이터 넣기는 성공하였으나 블록체인에 접근실패", {});
                                res.json(response);
                            }

                        });

                    }
                });
            })

        });



    });
}


exports.showWarrantyDetail = function(req, res) {

    var id = req.body.id;
    var seller_id = req.body.seller_id;

    //블록체인에 있는 데이터를 검색해서 준다.
    var url = REST_API_ADDRESS + "Warranty/WARRANTY_" + id;
    console.log(url);
    request(url, function(error, reqResponse, body) {
        var warrantyData = JSON.parse(body);
        console.log(warrantyData);

        res.render('warranty_detail.html', { "warrantyData": warrantyData });
    });
}


// // 전체 상품 보기
// exports.showAllProducts = function(req, res) {

//     var selectQuery = "SELECT * FROM PRODUCTS";
//     con.query(selectQuery, function(err, result, field) {
//         if (err) {
//             response = makeResponse(0, "잘못된 쿼리문입니다.", {});
//             res.json(response);
//             return;
//         }
//         res.render('show_all_products.html', { 'products': result });
//     });
// }



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