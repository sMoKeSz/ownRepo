/**
 * Created by Iulian.Pelin on 3/24/2017.
 */

//node file system module
var fs = require('fs');
var config = require('../../config/dev');



var File = require('../../components/file');
var Watcher = new File(config.filesFolder);

Watcher.watch();

var parseSize = function (size, cb) {
    var newSize = {
        width : 0,
        height : 0
    };
    if(!size) {
        return cb(true, 'Size is not ok')
    }
    size = size.toLowerCase();
    var sizeArray = size.split('x');

    if(sizeArray[0] && sizeArray[1]) {
        newSize.width = parseInt(sizeArray[0]);
        newSize.height = parseInt(sizeArray[1]);
    }
    else {
        return cb(true, 'Size is not ok!')
    }

    if(newSize.width > 0 && newSize.height > 0) {
        return cb(null, newSize);
    }
    else {
        return cb(true, 'Size is not ok!')
    }

};

//get Image controller
exports.getImage = function (req, res) {
    //handle resize
    var parsedSized = null;
    var imageName = req.params.imageName;

    if(!Watcher.loaded) return res.json(503, 'Service unavailable');
    parseSize(req.query.size, function(err, newSize) {
        if(err) {
            parsedSized = null;
        }
        else {
            parsedSized = newSize;
        }
        Watcher.getFile(imageName, parsedSized, function(err, buffer) {
            if(err) {
                var status = err.status ? err.status : 503;
                var msg = err.message ? err.message : 'Internal Server Error';
                return res.json(status,msg);
            }
            res.writeHead(200);
            res.end(buffer);
        })
    } );

};


exports.getStats = function(req, res) {
    var resizedFiles = 0;
    Object.keys(Watcher.cachedFiles).forEach(function(key){
        var cachedFiles = Watcher.cachedFiles[key];
        resizedFiles += Object.keys(cachedFiles).length;
        if(cachedFiles.hasOwnProperty('default')) {
            resizedFiles--;
        }
    });
    var stats = {
        originalFiles : Object.keys(Watcher.files).length,
        resizedFiles : resizedFiles,
        cacheMiss : Watcher.miss,
        cacheHits : Watcher.hits
    };

    return res.json(200, stats);
};