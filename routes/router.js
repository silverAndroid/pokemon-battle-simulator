/**
 * Created by silver_android on 07/02/16.
 */

const controller = require('../controllers/controller');
let app = require('express').Router();

/* GET nature stat changes from api */
app.get('/nature', controller.getNatureStatChanges);
/* GET Pokemon from api */
app.get('/pokemon', controller.getPokemon);
/* GET Pokemon type effectiveness from api */
app.get('/pokemon/typeEff', controller.getTypeEffectiveness);
/* GET move from api */
app.get('/move', controller.parseMove);

module.exports = app;
