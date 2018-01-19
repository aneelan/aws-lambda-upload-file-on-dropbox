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
  
  var dbx = new Dropbox({ accessToken: dropboxAccessCode });

  var filePath = '';

  var commitInfo = {
    "contents": formData,
    "path": dropboxPath + filename
  };
  //console.log("commitInfo:" + JSON.stringify(commitInfo));
  dbx.filesUpload(commitInfo).then(function (response) {
    msg = "Dropbox file upload successfully.Response: " + response;
    console.log(msg);
    context.succeed();
    })
    .catch(function (err) {
      msg = "Error Uploading Dropbox file" + err;
      console.log(msg);
      context.fail();
    });
    

  const response = { "message": msg };

  callback(null, response);
  
  
};

