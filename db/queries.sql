--get Pokemon
SELECT sname.name, stat_names.name AS stat_name, pokemon_stats.base_stat, pokemon_stats.effort FROM pokemon
 JOIN pokemon_species_names AS sname ON sname.pokemon_species_id = pokemon.id JOIN pokemon_stats ON pokemon
 .id = pokemon_stats.pokemon_id JOIN stat_names ON pokemon_stats.stat_id = stat_names.stat_id WHERE pokemon
 .id = $index AND sname.local_language_id = 9 AND stat_names.local_language_id = 9;
 
--get moves for Pokemon
SELECT DISTINCT ON (move_names.name) move_names.name, moves.power, moves.accuracy, type_names.name AS type,
 move_damage_classes.identifier AS damage_type, move_effect_prose.effect FROM move_names JOIN moves ON
 moves.id = move_names.move_id JOIN move_effect_prose ON moves.effect_id = move_effect_prose.move_effect_id
  JOIN pokemon_moves ON pokemon_moves.move_id = moves.id JOIN pokemon ON pokemon.id = pokemon_moves
  .pokemon_id JOIN pokemon_species ON pokemon_species.id = pokemon.species_id JOIN pokemon_species_names AS
   psname ON psname.pokemon_species_id = pokemon_species.id JOIN type_names ON type_names.type_id = moves
   .type_id JOIN move_damage_classes ON moves.damage_class_id = move_damage_classes.id WHERE move_names
   .local_language_id = 9 AND type_names.local_language_id = 9 AND psname.local_language_id = 9 AND
   move_effect_prose.local_language_id = 9 AND pokemon_moves.pokemon_id = $index AND pokemon_moves.level <=
    $level AND pokemon_moves.version_group_id = 16;

--get type for Pokemon
SELECT snames.name, tnames.name AS type FROM pokemon_species_names AS snames JOIN pokemon AS p ON p
.species_id = snames.pokemon_species_id JOIN pokemon_types AS pt ON pt.pokemon_id = p.id JOIN type_names AS
 tnames ON pt.type_id = tnames.type_id WHERE tnames.local_language_id = 9 AND p.species_id = $index AND snames
 .local_language_id = 9;

 --get bases stats for Pokemon
 SELECT sname.name, stat_names.name AS stat_name, pokemon_stats.base_stat, pokemon_stats.effort FROM
 pokemon JOIN pokemon_species_names AS sname ON sname.pokemon_species_id = pokemon.id JOIN pokemon_stats ON
  pokemon.id = pokemon_stats.pokemon_id JOIN stat_names ON pokemon_stats.stat_id = stat_names.stat_id WHERE
   pokemon.id = 8 AND sname.local_language_id = 9 AND stat_names.local_language_id = 9;

--get type effectiveness where 2nd type is array
SELECT damage_type_id, target_type_id, damage_factor FROM type_efficacy WHERE damage_type_id IN (SELECT id
FROM types WHERE identifier = $type1) AND type_efficacy.target_type_id IN (SELECT id FROM types WHERE
identifier = $type2[0] OR identifier = $type2[1]);

--get type effectiveness where 2nd type isn't array
SELECT damage_type_id, target_type_id, damage_factor FROM type_efficacy WHERE damage_type_id IN (SELECT id
FROM types WHERE identifier = $type1) AND type_efficacy.target_type_id IN (SELECT id FROM types WHERE
identifier = $type2);

--get nature stat changes
SELECT increased_stat_id, decreased_stat_id FROM natures WHERE id = $index;