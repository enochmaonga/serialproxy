const responseMessage = require("../utils/responseMessage");

function wrapResponse(req, res, next) {
  if (res.json) {
    const originalJson = res.json;
    
    // Override the json method to intercept JSON responses
    res.json = function (body) {
      const newBody = responseMessage(res.statusCode, body);
      
      // Call the original json method to send the response
      originalJson.call(this, newBody);
    };
  }
  next();
}

module.exports = wrapResponse;
