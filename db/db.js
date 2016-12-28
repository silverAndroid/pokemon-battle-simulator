/**
 * Created by silver_android on 07/02/16.
 */

const when = require('when');
const knex = require('knex')({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    searchPath: 'pokedex'
});

let query = require('pg-query');
query.connectionParameters = process.env.DATABASE_URL;

let handleError = (err, callback, status = 500) => {
    callback({
        err,
        status
    });
};

module.exports.getPokemon = (level, index, callback) => {
    if (!level || level < 1 || level > 100) {
        console.log(level);
        return handleError({
            message: 'Invalid level'
        }, callback, 400);
    }
    if (!index || index < 1 || (index > 721 && index < 10001) || index > 10090) {
        console.log(index);
        return handleError({
            message: 'Invalid index'
        }, callback, 400);
    }

    const getPokemonSQL = knex.select(['sname.name', 'stat_names.name AS stat_name', 'pokemon_stats.base_stat', 'pokemon_stats.effort'])
        .from('pokemon')
        .join('pokemon_species_names as sname', {'sname.pokemon_species_id': 'pokemon.id'})
        .join('pokemon_stats', {'pokemon.id': 'pokemon_stats.pokemon_id'})
        .join('stat_names', {'pokemon_stats.stat_id': 'stat_names.stat_id'})
        .where({'pokemon.id': index, 'sname.local_language_id': 9, 'stat_names.local_language_id': 9});

    const getMovesSQL = knex.select(['moves.power', 'moves.accuracy', 'type_names.name as type', 'move_damage_classes.identifier as damage_type', 'move_effect_prose.effect'])
        .distinct('move_names.name')
        .from('move_names')
        .join('moves', {'moves.id': 'move_names.move_id'})
        .join('move_effect_prose', {'moves.effect_id': 'move_effect_prose.move_effect_id'})
        .join('pokemon_moves', {'pokemon_moves.move_id': 'moves.id'})
        .join('pokemon', {'pokemon.id': 'pokemon_moves.pokemon_id'})
        .join('pokemon_species', {'pokemon_species.id': 'pokemon.species_id'})
        .join('pokemon_species_names as psname', {'psname.pokemon_species_id': 'pokemon_species.id'})
        .join('type_names', {'type_names.type_id': 'moves.type_id'})
        .join('move_damage_classes', {'moves.damage_class_id': 'move_damage_classes.id'})
        .where({
            'move_names.local_language_id': 9,
            'type_names.local_language_id': 9,
            'psname.local_language_id': 9,
            'move_effect_prose.local_language_id': 9,
            'pokemon_moves.version_group_id': 16,
            'pokemon_moves.pokemon_id': index
        })
        .where('pokemon_moves.level', '<=', level);

    const getPokemonTypeSQL = knex.select(['snames.name', 'tnames.name as type'])
        .from('pokemon_species_names as snames')
        .join('pokemon as p', {'p.species_id': 'snames.pokemon_species_id'})
        .join('pokemon_types as pt', {'pt.pokemon_id': 'p.id'})
        .join('type_names as tnames', {'pt.type_id': 'tnames.type_id'})
        .where({
            'tnames.local_language_id': 9,
            'snames.local_language_id': 9,
            'p.species_id': index
        });

    when.all([
        query(getPokemonSQL.toString()),
        query(getMovesSQL.toString()),
        query(getPokemonTypeSQL.toString())
    ]).spread((pokemon, moves, type) => {
        pokemon = pokemon[0];
        moves = moves[0];
        type = type[0];
        let baseStats = [];
        for (let i = 0; i < pokemon.length; i++) {
            const row = pokemon[i];
            const stat = {
                name: row.stat_name,
                value: row.base_stat,
                effort: row.effort
            };
            baseStats.push(stat);
        }

        let types = [];
        const max = type.length > 2 ? 2 : type.length;
        for (let i = 0; i < max; i++) {
            types[i] = type[i].type;
        }

        let data = {
            name: pokemon[0].name,
            level: level,
            health: 100,
            baseStats: baseStats,
            moves: moves.map(move => {
                return {
                    name: move.name,
                    accuracy: (move.accuracy == null ? 100 : move.accuracy),
                    power: move.power,
                    status: move.damage_type,
                    type: move.type,
                    effect: move.effect
                }
            }),
            type: types,
            err: null,
            status: 200
        };

        callback(data);
    }, err => {
        handleError(err, callback);
    });
};

module.exports.getTypeEffectiveness = (type1, type2, callback) => {
    type1 = type1.toLowerCase();
    if (type2 instanceof Array) {
        for (let i = 0; i < type2.length; i++) {
            type2[i] = type2[i].toLowerCase();
        }
    } else {
        type2 = [type2.toLowerCase()];
    }
    console.log(`Type 1 = ${type1}, type 2 = ${type2}`);

    let getType2EffectivenessSQL = knex.select('id')
        .from('types')
        .where({identifier: type2[0]});

    for (let i = 1; i < type2.length; i++) {
        getType2EffectivenessSQL = getType2EffectivenessSQL.orWhere({identifier: type2[i]});
    }

    const getEffectivenessSQL = knex.select(['damage_type_id', 'target_type_id', 'damage_factor'])
        .from('type_efficacy')
        .whereIn('damage_type_id', () => {
            this.select('id')
                .from('types')
                .where({identifier: type1})
        })
        .whereIn('type_efficacy.target_type_id', getType2EffectivenessSQL);

    when.all[
        query(getEffectivenessSQL.toString())
        ].spread(typeEffectiveness => {
        let effectiveness = 1;
        typeEffectiveness = typeEffectiveness[0];

        for (let i = 0; i < typeEffectiveness.length; i++) {
            effectiveness *= typeEffectiveness[i].damage_factor / 100;
        }
        callback({
            status: 200,
            err: null,
            effectiveness
        });
    }, err => {
        handleError(err, callback);
    });
};

module.exports.getNatureStatChanges = (index, callback) => {
    console.log(`Index = ${index}`);
    const getNatureChangesSQL = knex.select(['increased_stat_id', 'decreased_stat_id'])
        .from('natures')
        .where({
            id: index
        });

    when.all([
        query(getNatureChangesSQL.toString())
    ]).spread(natureChanges => {
        natureChanges = natureChanges[0];
        natureChanges.status = 200;
        callback(natureChanges);
    }, err => {
        handleError(err, callback);
    })
};

module.exports.parseMove = (name, callback) => {
    console.log(("Move name = " + name));
    var data = {};

    const moveParseSQL = knex.select(['move_meta.move_id', 'move_meta_categories.identifier AS meta_category', 'move_meta_ailments.identifier AS meta_ailment', 'min_hits', 'max_hits', 'min_turns', 'max_turns', 'drain', 'healing', 'crit_rate', 'ailment_chance', 'flinch_chance', 'stat_chance'])
        .from('move_meta')
        .join('move_names', {'move_meta.move_id': 'move_names.move_id'})
        .join('move_meta_categories', {'move_meta.meta_category_id': 'move_meta_categories.id'})
        .join('move_meta_ailments', {'move_meta.meta_ailment_id': 'move_meta_ailments.id'})
        .where({'move_names.name': name, 'move_names.local_language_id': 9});

    const getStatChangerSQL = knex.select(['stat_names.name AS stat', 'change'])
        .from('move_meta_stat_changes')
        .join('stat_names', {'stat_names.stat_id': 'move_meta_stat_changes.stat_id'})
        .where({'stat_names.local_language_id': 9})
        .whereIn('move_meta_stat_changes.move_id', () => {
            this.select(['move_id'])
                .from('move_names')
                .where({
                    name
                });
        });

    when.all([
        query(moveParseSQL.toString()),
        query(getStatChangerSQL.toString())
    ]).spread((moveParser, statChanger) => {
        moveParser = moveParser[0];
        statChanger = statChanger[0];
        moveParser.status = 200;
        moveParser.statsChanged = statChanger;
        
        callback(moveParser);
    }, err => {
        handleError(err, callback);
    })
};