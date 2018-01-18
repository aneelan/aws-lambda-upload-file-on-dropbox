exports.Parse = function (multipartBodyBuffer, boundary) {
    var process = function (part) {
        // will transform this object:
        // { header: 'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"',
        //	 info: 'Content-Type: text/plain',
        //	 part: 'AAAABBBB' }
        // into this one:
        // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
        var obj = function (o, str) {
            var k = str.split('=');
            var a = k[0].trim();
            var b = JSON.parse(k[1].trim());
            //var o = {};
            Object.defineProperty(o, a,
                { value: b, writable: true, enumerable: true, configurable: true })
            return o;
        }
        var propName = function (o, str) {
            var k = str.split('=');
            var a = k[0].trim();
            var b = JSON.parse(k[1].trim());
            //var o = {};
            Object.defineProperty(o, a,
                { value: b, writable: true, enumerable: true, configurable: true })
            return o;
        }

        var header = part.header.split(';');
        var file = {};
        var type = 'field';
        if (header.length >= 1) {
            propName(file, header[1]);
        }
        if (header.length > 2) {
            obj(file, header[2]);
            type = 'file';
        }

        //var file = obj(header[2]);
        var contentType = '';
        if (part.info.length > 0) {
            contentType = part.info.split(':')[1].trim();
        }
        Object.defineProperty(file, 'type',
            { value: type, writable: true, enumerable: true, configurable: true })
        Object.defineProperty(file, 'contentType',
            { value: contentType, writable: true, enumerable: true, configurable: true })

        if (type === 'file') {
            Object.defineProperty(file, 'data',
                { value: new Buffer(part.part, 'binary'), writable: true, enumerable: true, configurable: true })
        } else {
            Object.defineProperty(file, 'value',
                { value: part.value, writable: true, enumerable: true, configurable: true })
        }

        return file;
    }
    var prev = null;
    var lastline = '';
    var value = '';
    var header = '';
    var info = ''; var state = 0; var buffer = [];
    var allParts = [];

    for (i = 0; i < multipartBodyBuffer.length; i++) {
        var oneByte = multipartBodyBuffer[i];
        var prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
        var newLineDetected = ((oneByte == 0x0a) && (prevByte == 0x0d)) ? true : false;
        var newLineChar = ((oneByte == 0x0a) || (oneByte == 0x0d)) ? true : false;

        if (!newLineChar)
            lastline += String.fromCharCode(oneByte);

        if ((0 == state) && newLineDetected) {
            if (("--" + boundary) == lastline) {
                state = 1;
            }

            lastline = '';
        } else
            if ((1 == state) && newLineDetected) {
                header = lastline;
                state = 2;
                lastline = '';
            } else
                if ((2 == state) && newLineDetected) {
                    info = lastline;
                    state = 3;
                    lastline = '';
                } else
                    if ((3 == state) && newLineDetected) {
                        state = 4;
                        buffer = [];
                        value = lastline;
                        lastline = '';
                    } else
                        if (4 == state) {
                            if (lastline.length > (boundary.length + 4)) lastline = ''; // mem save
                            if (((("--" + boundary) == lastline))) {
                                var j = buffer.length - lastline.length;
                                var part = buffer.slice(0, j - 1);
                                var p = { header: header, info: info, part: part, value: value };
                                allParts.push(process(p));
                                buffer = []; lastline = ''; state = 5; header = ''; info = ''; value = '';
                            } else {
                                buffer.push(oneByte);
                            }
                            if (newLineDetected) {
                                lastline = ''
                            };
                        } else
                            if (5 == state) {
                                if (newLineDetected)
                                    state = 1;
                            }
    }
    return allParts;
};

//  read the boundary from the content-type header sent by the http client
//  this value may be similar to:
//  'multipart/form-data; boundary=----WebKitFormBoundaryvm5A9tzU1ONaGP5B',
exports.getBoundary = function (header) {
    var items = header.split(';');
    if (items)
        for (i = 0; i < items.length; i++) {
            var item = (new String(items[i])).trim();
            if (item.indexOf('boundary') >= 0) {
                var k = item.split('=');
                return (new String(k[1])).trim();
            }
        }
    return "";
}
