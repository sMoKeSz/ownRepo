/**
 * Created by Iulian.Pelin on 3/24/2017.
 */


var cho = require('chokidar');
var sharp = require('sharp');

var config = require('../config/dev');


function TheWatcher(folder) {

    this.folder = './' + folder;
    this.files = {};
    this.cachedFiles = {};
    this.watcher = null;
    this.loaded = false;
    this.hits = 0;
    this.miss = 0;
}
/**
 * //Initialize watcher
 * //Register Events
 * **/
TheWatcher.prototype.watch = function () {
    this.watcher = cho.watch(this.folder);
    this.registerEvents();
};

/**
 * Init watcher events
 * **/
TheWatcher.prototype.registerEvents = function () {
    var self = this;

    //on watcher is ready
    this.watcher.on('ready', function () {
        self.loaded = true;
    });

    //on watcher error reinitialize watcher
    this.watcher.on('error', function () {
        try {
            self.watcher.close();
        }
        catch (e) {
            console.log('Watcher already closed ' + e);
        }
        self.files = {};
        self.loaded = false;
        self.cachedFiles = {};
        self.watch();
    });

    //file added
    this.watcher.on('add', function (path) {
        var filename = path.replace(/^.*[\\\/]/, '');
        self.files[filename] = path;
    });

    //file changed
    this.watcher.on('change', function (path) {
        var filename = path.replace(/^.*[\\\/]/, '');
        if (config.clearCacheOnChange) {
           delete self.cachedFiles[filename] ;
        }
        console.log('changed ' + filename);
    });

    //file removed
    this.watcher.on('unlink', function (path) {
        var filename = path.replace(/^.*[\\\/]/, '');
        if (config.clearCacheOnDelete) {
            delete self.cachedFiles[filename] ;
        }
        console.log('removed ' + filename);
    })
};

/** Returns file byte array from cache
 * @fileName -- Full name of the file (original name + file extension
 * @size -- size object with width and height property
 * @fileSized -- html raw file size ex {{width}}x{{heigth}}
 * @callback -- returns err or the image byte array
 **/
TheWatcher.prototype.getFile = function (fileName, size, cb) {
    var sized = '';
    if (size) {
        sized = size.width + 'x' + size.height;
    }
    else {
        sized = 'default'
    }
    var self = this;
    var file = self.cachedFiles[fileName];
    // search file in cache
    if (self.cachedFiles.hasOwnProperty(fileName) && file && file[sized] && file[sized].buffer ) {
        console.log('from cache ', fileName, ' ', sized);
        self.hits++;
        self.resetCachedTime(fileName, sized, config.cacheTime);
        return cb(false, file[sized].buffer);
    }
    else {
        //increment cache miss
        self.miss++;
        //call the real file
        self.getRealFile(fileName, size, sized,  cb);
    }
};

/** Returns file byte array from server or error
 * @fileName -- Full name of the file (original name + file extension
 * @size -- size object with width and height property
 * @fileSized -- html raw file size ex {{width}}x{{heigth}}
 * @callback -- returns err or the image byte array
**/

TheWatcher.prototype.getRealFile = function (fileName, size, fileSized, cb) {
    var self = this;


    if (self.files.hasOwnProperty(fileName) && self.files[fileName]) {
        var sharpObj = sharp(self.files[fileName]);
        //resize if needed
        if(size) {
            sharpObj.resize(size.width, size.height);
        }
        //keep aspect ratio of pictore if set
        if(config.keepAspectRatio) {
            sharpObj.max();
        }
        sharpObj.toBuffer()
            .then(function (buffer) {

                if(!self.cachedFiles[fileName]) {
                    self.cachedFiles[fileName]  = {};
                }
                //add buffer to cache
                self.cachedFiles[fileName][fileSized] = {buffer: buffer};
                //add cache duration
                self.addCachedTime(fileName, fileSized, config.cacheTime);
                return cb(null, buffer);
            })
            .catch(function (err) {
                return cb(err);
            });
    }
    else {
        cb({message : 'File not found', status : 404});
    }
};
/** Add cache time
* @fileName -- Full name of the file (original name + file extension
* @fileSized -- html raw file size ex {{width}}x{{heigth}}
* @cacheDuration -- Duration in ms of cache
 **/
TheWatcher.prototype.addCachedTime = function (fileName, sized, cacheDuration) {
    var self = this;
    if(cacheDuration) {
        self.cachedFiles[fileName][sized].cacheTimeout = setTimeout(function(){
            delete self.cachedFiles[fileName][sized];
        }, cacheDuration)
    }
};
/** Reset Cache time
 * @fileName -- Full name of the file (original name + file extension
 * @fileSized -- html raw file size ex {{width}}x{{heigth}}
 * @cacheDuration -- Duration in ms of cache
 **/
TheWatcher.prototype.resetCachedTime = function(fileName, sized, cacheDuration) {
    var self = this;

    if(cacheDuration) {
        clearTimeout(self.cachedFiles[fileName][sized].cacheTimeout);
        self.addCachedTime(fileName,sized,cacheDuration);
    }

};

module.exports = TheWatcher;