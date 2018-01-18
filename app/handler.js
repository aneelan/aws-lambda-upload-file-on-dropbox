'use strict';
var multipart = require("./common/parser");
var Dropbox = require('dropbox');
var fs = require('fs');

module.exports.upload = (event, context, callback) => {
  
  console.log("commitInfo:" + JSON.stringify(event));
  var bodyBuffer = new Buffer(event['body-json'].toString(), 'base64');
  var boundary = multipart.getBoundary(event.params.header['content-type']);
  var parts = multipart.Parse(bodyBuffer, boundary);

  var dropboxPath = '';
  var dropboxAccessCode = '';
  var filename = '';
  var formData = null;

  var msg = '';

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    console.log(JSON.stringify(part));
    if (part.name === 'dropboxPath') {
      dropboxPath = part.value;
      while (dropboxPath.indexOf('\\') != -1) {
        dropboxPath = dropboxPath.replace('\\', '/');
      }
    } else if (part.name === 'dropboxAccessCode') {
      dropboxAccessCode = part.value;
    } else if (part.name === 'myfile') {
      filename = part.filename;
      formData = part.data;
    }
  }
  console.log("uploading to drop box");
  console.log("Parts:"+JSON.stringify(parts));
  var dbx = new Dropbox({ accessToken: dropboxAccessCode });

  var filePath = '';

  //filePath = "/Users/aneela/Desktop/abc/" + filename;
  /*filePath = filename;
  fs.writeFile(filePath, formData, function (err) {
    if (err) {
      msg = "Error Writing file " + err;
      console.log(msg);
      //context.fail("writeFile failed: " + err);
    } else {
      fs.readFile(filePath, function (err, data) {
        if (err !== null) {
          msg = "Error Reading file " + err;
          console.log(msg);
        }*/
        var commitInfo = {
          "contents": formData,
          "path": dropboxPath + filename
        };
        //console.log("commitInfo:" + JSON.stringify(commitInfo));
        dbx.filesUpload(commitInfo, function (error, stat) {
          if (error !== null) {
            msg = "Error Uploading Dropbox file" + error;
            console.log(msg);
          }
          //context.succeed("writeFile succeeded");
          msg = "Dropbox file upload successfully ";
          console.log(msg);

          const response = {
            statusCode: 200,
            body: JSON.stringify({
              message: msg,
              input: event,
            }),
          };

          callback(null, response);
        });
//      });
//    }
//  });
  

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

