/**
 * Created by silver_android on 07/02/16.
 */

var dbURL = 'postgres://localhost/pokedex?user=silver_android&password=pokemonxy3DS&ssl=true';
var db = require('pg-bricks').configure(dbURL);

module.exports = {

    getPokemon: function (level, index, callback) {

        var data = {};

        db.select(['sname.name', 'stat_names.name AS stat_name', 'pokemon_stats.base_stat',
            'pokemon_stats.effort']).from('pokemon').join('pokemon_species_names AS sname')
            .on('sname.pokemon_species_id', 'pokemon.id').join('pokemon_stats').on('pokemon.id',
            'pokemon_stats.pokemon_id').join('stat_names').on('pokemon_stats.stat_id', 'stat_names.stat_id')
            .where({'pokemon.id': index, 'sname.local_language_id': 9, 'stat_names.local_language_id': 9})
            .rows(function (err, rows) {
                if (!err) {
                    data['name'] = rows[0]['name'];
                    data['level'] = level;
                    data['health'] = 100;
                    var baseStats = [];
                    for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        var stat = {};
                        var statName = row['stat_name'].replace(" ", "_").toLowerCase();
                        stat[statName] = row['base_stat'];
                        stat['effort'] = row['effort'];
                        baseStats.push(stat);
                    }
                    data['base_stats'] = baseStats;
                    db.raw("SELECT DISTINCT ON (move_names.name) move_names.name, moves.power," +
                            " moves.accuracy, type_names.name AS type, move_damage_classes.identifier AS" +
                            " damage_type, move_effect_prose.effect FROM move_names JOIN moves ON moves.id =" +
                            " move_names.move_id JOIN move_effect_prose ON moves.effect_id =" +
                            " move_effect_prose.move_effect_id JOIN pokemon_moves ON pokemon_moves.move_id =" +
                            " moves.id JOIN pokemon ON pokemon.id = pokemon_moves.pokemon_id JOIN" +
                            " pokemon_species ON pokemon_species.id = pokemon.species_id JOIN" +
                            " pokemon_species_names AS psname ON psname.pokemon_species_id =" +
                            " pokemon_species.id JOIN type_names ON type_names.type_id = moves.type_id JOIN" +
                            " move_damage_classes ON moves.damage_class_id = move_damage_classes.id WHERE" +
                            " move_names.local_language_id = 9 AND type_names.local_language_id = 9 AND" +
                            " psname.local_language_id = 9 AND move_effect_prose.local_language_id = 9 AND" +
                            " pokemon_moves.pokemon_id = 657 AND pokemon_moves.level <= 32 AND" +
                            " pokemon_moves.version_group_id = 16")
                        .rows(function (err, rows) {
                            if (!err) {
                                var moves = [];
                                for (var i = 0; i < rows.length; i++) {
                                    var row = rows[i];
                                    var move = {};
                                    move['name'] = row['name'];
                                    var accuracy = row['accuracy'];
                                    move['accuracy'] = accuracy == null ? 100 : accuracy;
                                    move['power'] = row['power'];
                                    move['status'] = row['damage_type'];
                                    move['type'] = row['type'];
                                    move['effect'] = row['effect'];
                                    moves.push(move);
                                }

                                data['moves'] = moves;

                                db.select(['snames.name', 'tnames.name AS type'])
                                    .from('pokemon_species_names AS snames').join('pokemon AS p')
                                    .on('p.species_id', 'snames.pokemon_species_id').join('pokemon_types' +
                                    ' AS pt').on('pt.pokemon_id', 'p.id').join('type_names AS tnames')
                                    .on('pt.type_id', 'tnames.type_id').where({
                                    'tnames.local_language_id': 9,
                                    'p.species_id': index, 'snames.local_language_id': 9
                                }).rows(function (err, rows) {
                                    if (!err) {
                                        var type = [];
                                        var max = rows.length > 2 ? 2 : rows.length;
                                        for (var i = 0; i < max; i++) {
                                            type[i] = rows[i]['type'];
                                        }
                                        data['type'] = type;
                                        data['status'] = 200;
                                        callback(data);
                                    } else {
                                        err['status'] = 500;
                                        err['reason'] = "Couldn't find type of Pokemon";
                                        callback(err);
                                    }
                                });
                            } else {
                                err['status'] = 500;
                                err['reason'] = "Couldn't find moves for the Pokemon";
                                callback(err);
                            }
                        });
                } else {
                    err['status'] = 500;
                    err['reason'] = "Couldn't find Pokemon";
                    callback(err);
                }
            })
    },

    getTypeEffectiveness: function (type1, type2, callback) {
        var effectiveness = 1;
        type1 = type1.toLowerCase();
        if (type2 instanceof Array) {
            for (var i = 0; i < type2.length; i++) {
                type2[i] = type2[i].toLowerCase();
            }
        } else {
            type2 = type2.toLowerCase();
        }
        console.log(("Type 1 = " + type1 + ", type 2 = " + type2));

        if (type2 instanceof Array) {
            console.log('type2 is an array');
            db.raw("SELECT damage_type_id, target_type_id, damage_factor FROM type_efficacy WHERE" +
                    " damage_type_id IN (SELECT id FROM types WHERE identifier = \'" + type1 + "\') AND" +
                    " type_efficacy.target_type_id IN (SELECT id FROM types WHERE identifier =\'" + type2[0] +
                    "\'" + (type2[1] != undefined ? " OR identifier=\'" + type2[1] + "\'" : "") + ");")
                .rows(function (err, rows) {
                    if (!err) {
                        for (var i = 0; i < rows.length; i++) {
                            effectiveness *= (rows[i]['damage_factor'] / 100);
                        }
                        console.log(effectiveness);
                        callback({status: 200, effectiveness: effectiveness});
                    } else {
                        err['status'] = 500;
                        err['reason'] = "Couldn't find type";
                        callback(err);
                    }
                });

        } else {
            console.log('type2 is not an array');
            db.raw("SELECT damage_type_id, target_type_id, damage_factor FROM type_efficacy WHERE" +
                " damage_type_id IN (SELECT id FROM types WHERE identifier = \'" + type1 + "\') AND" +
                " type_efficacy.target_type_id IN (SELECT id FROM types WHERE identifier =\'" + type2 +
                "\');").row(
                function (err, row) {
                    if (!err) {
                        effectiveness *= (row['damage_factor'] / 100);
                        console.log(effectiveness);
                        callback({status: 200, effectiveness: effectiveness});
                    } else {
                        err['status'] = 500;
                        err['reason'] = "Couldn't find type";
                        callback(err);
                    }
                });
        }
    },

    getNatureStatChanges: function (index, callback) {
        console.log(("Index = " + index));
        db.select(['increased_stat_id', 'decreased_stat_id']).from('natures').where('id', index)
            .row(function (err, row) {
                if (!err) {
                    row['status'] = 200;
                    callback(row);
                } else {
                    err['status'] = 500;
                    err['reason'] = "Couldn't find nature";
                    callback(err);
                }
            });
    },

    parseMove: function (name, callback) {
        console.log(("Move name = " + name));
        var data = {};
        db.select(['move_meta.move_id', 'move_meta_categories.identifier AS meta_category',
                'move_meta_ailments.identifier AS meta_ailment', 'min_hits', 'max_hits', 'min_turns',
                'max_turns', 'drain', 'healing', 'crit_rate', 'ailment_chance', 'flinch_chance',
                'stat_chance'])
            .from('move_meta').join('move_names').on('move_meta.move_id', 'move_names.move_id')
            .join('move_meta_categories').on('move_meta.meta_category_id', 'move_meta_categories.id')
            .join('move_meta_ailments').on('move_meta.meta_ailment_id', 'move_meta_ailments.id')
            .where({'move_names.name': name, 'move_names.local_language_id': 9}).row(function (err, row) {
            if (!err) {
                if (row['meta_category'] == 'net-good-stats' || row['meta_category'] == 'damage+lower' ||
                    row['meta_category'] == 'damage+raise') {
                    data = row;
                    db.select(['stat_names.name AS stat', 'change']).from('move_meta_stat_changes')
                        .join('stat_names').on('stat_names.stat_id', 'move_meta_stat_changes.stat_id')
                        .where({
                            'stat_names.local_language_id': 9,
                            'move_meta_stat_changes.move_id': data['move_id']
                        }).row(function (err, row) {
                            if (!err) {
                                data['name'] = name;
                                data['stat'] = row['stat'].toLowerCase().replace(" ", "_");
                                data['stat_change'] = row['change'];
                                data['status'] = 200;
                                callback(data);
                            } else {
                                err['status'] = 500;
                                err['reason'] = "Couldn't get stat change for move";
                                callback(err);
                            }
                        }
                    )
                } else {
                    row['status'] = 200;
                    callback(row);
                }
            } else {
                err['status'] = 500;
                err['reason'] = "Couldn't find move to parse";
                callback(err);
            }
        })
    }
}
;