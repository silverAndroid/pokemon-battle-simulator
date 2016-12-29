/**
 * Created by silver_android on 12/27/2016.
 */

const db = require('../db/db');

let sendResponse = (result, res) => {
    let status = result.status;
    delete result.status;
    res.status(status).json(result);
};

module.exports.getPokemon = (req, res) => {
    let {level, index} = req.query;
    db.getPokemon(level, index, result => {
        sendResponse(result, res);
    });
};

module.exports.getTypeEffectiveness = (req, res) => {
    let {type1, type2} = req.query;
    db.getTypeEffectiveness(type1, type2, result => {
        sendResponse(result, res);
    });
};

module.exports.parseMove = (req, res) => {
    let {name} = req.query;
    db.parseMove(name, result => {
        sendResponse(result, res);
    });
};