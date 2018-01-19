'use strict';
var Dropbox = require('dropbox');
var http = require('http');
var https = require('https');
var bl = require('bl');

module.exports.upload = (event, context, callback) => {
  console.log(JSON.stringify(event));

  var fileUrl = '';
  var dropboxPath = '';
  var dropboxAccessCode = '';
  var filename = '';
  var formData = null;
  var isHttps = false;
  var msg;

  var sendResponse = function (status, msg) {
    var body = JSON.stringify({
      status: status,
      message: msg
    })
    var response = {
      statusCode: 200,
      body: body,
    };
    callback(null, response);
    return;
  };

  if (event['body'] != undefined) {
    try {
      var obj = JSON.parse(event['body']);
      console.log("obj" + JSON.stringify(obj));
      fileUrl = obj.fileUrl;
      dropboxPath = obj.dropboxPath;
      dropboxAccessCode = obj.dropboxAccessCode;
      console.log("fileUrl:" + fileUrl);
      if (fileUrl != undefined) {
        if (fileUrl.indexOf("https") != -1) {
          isHttps = true;
        }
        filename = fileUrl.substr(fileUrl.lastIndexOf("/") + 1, fileUrl.length);
      }
    } catch (err) {
      msg = "Error:" + err;
      console.log(msg);
      sendResponse("error", msg);
    }
  }

  if (fileUrl == null || fileUrl == '') {
    msg = "File URL is missing";
    console.log(msg);
    sendResponse("error", msg);
  }
  if (dropboxAccessCode == null || dropboxAccessCode == '') {
    msg = "dropboxAccessCode is missing";
    console.log(msg);
    sendResponse("error", msg);
  }
  if (dropboxPath == null || dropboxPath == '') {
    msg = "dropboxPath is missing";
    console.log(msg);
    sendResponse("error", msg);
  }
  if (filename == null || filename == '') {
    msg = "filename is missing";
    console.log(msg);
    sendResponse("error", msg);
  }


  console.log("uploading to drop box");


  var dbx = new Dropbox({ accessToken: dropboxAccessCode });
  var handler = (isHttps ? https : http);

  var request = handler.get(fileUrl, function (response) {
    response.pipe(bl(function (err, data) {
      if (err)
        return console.error(err)
      var commitInfo = {
        "contents": new Buffer(data),
        "path": dropboxPath + filename
      };

      dbx.filesUpload(commitInfo).then(function (response) {
        msg = { response };
        console.log("Upload file on dropbox successfully");
        sendResponse("success", msg);
      })
        .catch(function (err) {
          msg = err;
          console.log(msg);
          sendResponse("error", msg);
        });
    }))
  });
};