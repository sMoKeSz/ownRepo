/**
 * Created by Iulian.Pelin on 3/24/2017.
 */
var express = require('express');
var controller = require('./image.controller');

//get the router so we can add an route
var router = express.Router();

//init route and add a controller

router.get('/stats', controller.getStats);
router.get('/:imageName', controller.getImage);

//export router.
module.exports = router;