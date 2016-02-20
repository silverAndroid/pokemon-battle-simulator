/**
 * Created by silver_android on 07/02/16.
 */
var express = require('express');
var router = express.Router();
var db = require('../api/db.js');

/* GET nature stat changes from api */
router.get('/natures', function (req, res) {
    console.log('Loading natures table');
    db.getNatureStatChanges(req.query['index'], function (result) {
        res.status(result['status']);
        res.json(result);
    });
});

router.get('/pokemon', function (req, res) {
    console.log('Loading pokemon table');
    db.getPokemon(req.query['level'], req.query['index'], function (result) {
        res.status(result['status']);
        res.json(result);
    })
});

router.get('/pokemon/typeEff', function (req, res) {
    console.log('Loading pokemon type effectiveness table');
    db.getTypeEffectiveness(req.query['type1'], req.query['type2'], function (result) {
        res.status(result['status']);
        res.json(result);
    })
});

router.get('/moves', function (req, res) {
    console.log('Loading pokemon moves table');
    db.parseMove(req.query['name'], function (result) {
        res.json(result);
    })
});

module.exports = router;
