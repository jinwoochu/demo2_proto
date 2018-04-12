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
            var selectQuery2 = "SELECT * FROM SELLERS WHERE id=?";
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
                            "seller": result2[0].name, // seller의 이름
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
    request(url, function(error, reqResponse, body) {
        var warrantyData = JSON.parse(body);
        res.render('warranty_detail.html', { "warrantyData": warrantyData });
    });
}


// 보증서 내용 수정하기
exports.editWarranty = function(req, res, checkCookie) {
    console.log(checkCookie);

    //유저 DB중에 쿠키와 대응한 email이 있으면 reject 시킨다.
    var selectQuery = "SELECT * FROM USERS WHERE email=?";
    var selectQueryParams = [checkCookie];

    //userId 구하기.
    con.query(selectQuery, selectQueryParams, function(err, result, field) {
        if (err) {
            response = makeResponse(0, "잘못된 쿼리문입니다.", {});
            res.json(response);
            return;
        }
        if (result.length != '0') { // 이메일이 존재하는 것 
            res.redirect('/userMyPage');
        } else {
            var id = req.body.id;
            var DBid = parseFloat(id.split('_')[1]);

            // 블록체인에 있는 상세정보부터 보여준다 일단.
            var url = REST_API_ADDRESS + "Warranty/" + id;
            request(url, function(error, reqResponse, body) {
                var warrantyData = JSON.parse(body);
                res.render('warranty_edit.html', { "warrantyData": warrantyData });
            });
        }
    });
}
exports.updateWarranty = function(req, res) {
    console.log(req.body)
    var id = req.body.id;
    var sellerId = req.body.sellerId
    var productId = req.body.productId
    var userId = req.body.userId
    var serialNumber = req.body.serialNumber
    var productName = req.body.productName
    var price = req.body.price
    var purchaseDay = req.body.purchaseDay
    var store = req.body.store
    var seller = req.body.seller
    var ExpireDay = req.body.ExpireDay
    var warrantyContents = req.body.warrantyContents


    var requestJsonData = {
        "$class": "org.acme.ling.ChangeWarranty",
        "warranty": "resource:org.acme.ling.Warranty#" + id,
        "sellerId": sellerId,
        "productId": productId,
        "userId": userId,
        "serialNumber": serialNumber,
        "productName": productName,
        "price": price,
        "purchaseDay": purchaseDay,
        "store": store,
        "seller": seller,
        "ExpireDay": ExpireDay,
        "warrantyContents": warrantyContents,
        "timestamp": (new Date()).toJSON()
    }

    var options = {
        url: REST_API_ADDRESS + 'ChangeWarranty',
        method: 'POST',
        json: requestJsonData
    };

    request(options, function(error, reqResponse, body) {
        if (!error && reqResponse.statusCode == 200) {
            // 블록체인에도 데이터 넣기 성공하면 
            res.redirect('/sellerMyPage');
        } else {
            response = makeResponse(0, "블록체인에 접근실패", {});
            res.json(response);
        }

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