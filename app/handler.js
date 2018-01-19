'use strict';
var multipart = require("./common/parser");
var Dropbox = require('dropbox');
var fs = require('fs');

module.exports.upload = (event, context, callback) => {
  
  var dropboxPath = '';
  var dropboxAccessCode = '';
  var filename = '';
  var formData = null;

  var msg = '';

  var sendResponse= function(status, msg) {
    var response = {
      "status": status,
      "message": msg
    };
    callback(null, response);
    return;
  };

  try {

    var bodyBuffer = new Buffer(event['body-json'].toString(), 'base64');
    var boundary = multipart.getBoundary(event.params.header['content-type']);
    var parts = multipart.Parse(bodyBuffer, boundary);

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      console.log("part size:" + parts.length);
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
  } catch (err) { 
    msg = "Error while parsing multipaprt request.Error:" + err;
    console.log(msg);
    sendResponse("error", msg);
  }

  if (dropboxAccessCode == null || dropboxAccessCode =='') {
    msg = "dropboxAccessCode is missing" ;
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
  if (formData == null || formData == '') {
    msg = "File Data is missing";
    console.log(msg);
    sendResponse("error", msg);
  }

  console.log("uploading to drop box");
  
  var dbx = new Dropbox({ accessToken: dropboxAccessCode });

  var filePath = '';

  var commitInfo = {
    "contents": formData,
    "path": dropboxPath + filename
  };
  
  dbx.filesUpload(commitInfo).then(function (response) {
    msg = { response };
    console.log("Upload file on dropbox successfully");
    sendResponse("success", msg);
  })
    .catch(function (err) {
      msg = err ;
      console.log(msg);
      sendResponse("error", msg);
    });


};