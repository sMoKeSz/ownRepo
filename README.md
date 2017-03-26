# ownRepo
0. Check config file :
    port : 9010,  // set port 
    cacheTime : 600000, // set cache clear time 
    filesFolder : 'server/files', // folder that is being watched
    clearCacheOnChange : true,  // clear cached file if an it is changed in filesFolder
    clearCacheOnDelete : true,  // clear cached file if an it is deleted in filesFolder
    keepAspectRatio : true // Keep image aspect ration
    
1. use dockerfile for build (docker build -t own .)
2. docker run -p externPort:9010 own
