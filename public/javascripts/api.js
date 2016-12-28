/**
 * Created by silver_android on 07/02/16.
 */

var apiURL = "http://localhost:3000";

function API() {
    this.db = {
        getNatureStatChanges: function (index, callback) {
            console.log("api controller: getNatureStatChanges");
            $.get(apiURL + "/controller/natures", {index: index}, function (res) {
                callback(res);
            })
        },
        getTypeEffectiveness: function (type1, type2, callback) {
            console.log('api controller: getTypeEffectiveness');
            $.get(apiURL + "/controller/pokemon/typeEff", {type1: type1, type2: type2}, function (res) {
                callback(res);
            })
        },
        getPokemon: function (level, index, callback) {
            console.log("api controller: getPokemon");
            $.get(apiURL + "/controller/pokemon", {level: level, index: index}, function (res) {
                callback(res);
            })
        },
        parseMove: function (name, callback) {
            console.log("api controller: parseMove");
            $.get(apiURL + "/controller/moves", {name: name}, function (res) {
                callback(res);
            })
        }
    };
}