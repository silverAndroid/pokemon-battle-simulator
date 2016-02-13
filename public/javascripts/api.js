/**
 * Created by silver_android on 07/02/16.
 */

var apiURL = "http://localhost:3000";

function API() {
    this.db = {
        getNatureStatChanges: function (index, callback) {
            console.log("api db: getNatureStatChanges");
            $.get(apiURL + "/db/natures", {index: index}, function (res) {
                callback(res);
            })
        },
        getTypeEffectiveness: function (type1, type2, callback) {
            console.log('api db: getTypeEffectiveness');
            $.get(apiURL + "/db/pokemon/typeEff", {type1: type1, type2: type2}, function (res) {
                callback(res);
            })
        },
        getPokemon: function (level, index, callback) {
            console.log("api db: getPokemon");
            $.get(apiURL + "/db/pokemon", {level: level, index: index}, function (res) {
                callback(res);
            })
        },
        parseMove: function (name, callback) {
            console.log("api db: parseMove");
            $.get(apiURL + "/db/moves", {name: name}, function (res) {
                callback(res);
            })
        }
    };
}