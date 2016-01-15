<?php
/**
 * Created by PhpStorm.
 * User: silver_android
 * Date: 26/12/15
 * Time: 10:19 PM
 */

$configs = include('config.php');

/**
 * @param $index int National Pokedex number
 * @param $level int Level of Pokemon
 */
function getPokemon($index, $level)
{
    $pokemon_query = "SELECT sname.name, pokemon.*, species.*, stat_names.name AS stat_name, pokemon_stats.base_stat,
     pokemon_stats.effort FROM pokemon JOIN pokemon_species AS species ON pokemon.species_id = species.id JOIN
     pokemon_species_names AS sname ON sname.pokemon_species_id = species.id JOIN pokemon_stats ON pokemon.id =
     pokemon_stats.pokemon_id JOIN stat_names ON pokemon_stats.stat_id = stat_names.stat_id WHERE pokemon.id = " .
        $index . " AND sname.local_language_id = 9 AND stat_names.local_language_id = 9";

    $pokemon_type_query = "SELECT snames.name, tnames.name AS type FROM pokemon_species_names AS snames JOIN pokemon AS p ON p.species_id =
snames.pokemon_species_id JOIN pokemon_types AS pt ON pt.pokemon_id = p.id JOIN type_names AS tnames ON pt.type_id =
tnames.type_id WHERE tnames.local_language_id = 9 AND p.species_id = " . $index . " AND snames.local_language_id = 9";

    $moves_query = "SELECT move_names.name, pokemon_moves.level, moves.power, moves.accuracy, type_names.name AS
    type, move_effect_prose.effect, move_damage_classes.identifier AS damage_type FROM move_names JOIN moves ON moves
    .id = move_names.move_id JOIN pokemon_moves ON pokemon_moves.move_id = moves.id JOIN pokemon ON pokemon.id =
    pokemon_moves.pokemon_id JOIN pokemon_species ON pokemon_species.id = pokemon.species_id JOIN
    pokemon_species_names AS psname ON psname.pokemon_species_id = pokemon_species.id JOIN move_effect_prose ON
    pokemon_moves.move_id = move_effect_id JOIN type_names ON type_names.type_id = moves.type_id JOIN
    move_damage_classes ON moves.damage_class_id = move_damage_classes.id WHERE move_names.local_language_id = 9 AND
    type_names.local_language_id = 9 AND pokemon_moves.pokemon_id = " . $index . " AND psname.local_language_id = 9
    AND pokemon_moves.level <= 45 AND pokemon_moves.version_group_id = 16;";

    $connection = getConnection();

    if ($connection->connect_error) {
        die("Connection failed!" . $connection->connect_error);
    }

    $pokemon_result = $connection->query($pokemon_query);
    $data = array();

    if ($pokemon_result->num_rows > 0) {
        while ($pokemon_row = $pokemon_result->fetch_assoc()) {
            $data = array("name" => $pokemon_row["name"], "level" => $level, "health" => 100);
        }
    } else {
        echo "No Pokemon found!";
    }

    $data['base_stats'] = array();
    $pokemon_result = $connection->query($pokemon_query);
    if ($pokemon_result->num_rows > 0) {
        while ($pokemon_row = $pokemon_result->fetch_assoc()) {
            $stats_data = array(str_replace(" ", "_", strtolower($pokemon_row['stat_name'])) =>
                $pokemon_row['base_stat'], "effort" => $pokemon_row['effort']);
            array_push($data['base_stats'], $stats_data);
        }
    }

    $moves_result = $connection->query($moves_query);
    $data['moves'] = array();

    if ($moves_result->num_rows > 0) {
        while ($moves_row = $moves_result->fetch_assoc()) {
            $moves_data = array("name" => $moves_row["name"], "accuracy" => $moves_row["accuracy"] == null ? 100 :
                $moves_row["accuracy"], "power" => $moves_row["power"], "status" => $moves_row["damage_type"], "type"
            => $moves_row["type"]);
            array_push($data['moves'], $moves_data);
        }
    } else {
        echo "No moves found!";
    }

    $pokemon_type_result = $connection->query($pokemon_type_query);

    $data['type'] = array();
    if ($pokemon_type_result->num_rows > 0) {
        $counter = 0;
        while ($pokemon_type_row = $pokemon_type_result->fetch_assoc()) {
            if (++$counter > 2)
                break;
            $pokemon_type = $pokemon_type_row["type"];
            array_push($data['type'], $pokemon_type);
        }
    } else {
        echo "No types found!";
    }

    header('Content-Type: application/json');
    echo json_encode($data);
    $connection->close();
}

function getTypeEffectiveness($type1, $type2)
{
    $effectiveness = 1;
    $query = array();
    if (is_array($type2)) {
        for ($i = 0; $i < 2; $i++) {
            array_push($query, "SELECT damage_type_id, target_type_id, damage_factor FROM type_efficacy WHERE
            damage_type_id IN (SELECT id FROM types WHERE identifier = '" . $type1 . "') AND type_efficacy.target_type_id
            IN (SELECT id FROM types WHERE identifier ='" . $type2[$i] . "');");
        }
    } else {
        array_push($query, "SELECT damage_type_id, target_type_id, damage_factor FROM type_efficacy WHERE
            damage_type_id IN (SELECT id FROM types WHERE identifier = '" . $type1 . "') AND type_efficacy.target_type_id
            IN (SELECT id FROM types WHERE identifier ='" . $type2 . "');");
    }

    $connection = getConnection();

    if ($connection->connect_error) {
        die("Connection failed!" . $connection->connect_error);
    }

    for ($i = 0; $i < count($query); $i++) {
        $result = $connection->query($query[$i]);

        if ($result->num_rows > 0) {
            $effectiveness_row = $result->fetch_assoc();
            $effectiveness *= $effectiveness_row["damage_factor"] / 100;
        }
    }
    $connection->close();

    echo $effectiveness;
}

function getNatureStatChanges($index)
{
    $connection = getConnection();

    if ($connection->connect_error) {
        die("Connection failed!" . $connection->connect_error);
    }

    $query = "SELECT increased_stat_id, decreased_stat_id FROM natures WHERE natures.id = " . $index . ";";

    $result = $connection->query($query);
    $data = array();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $data = array("increased_stat_index" => $row['increased_stat_id'], "decreased_stat_index" =>
            $row['decreased_stat_id']);
    }

    header('Content-Type: application/json');
    echo json_encode($data);
    $connection->close();
}

function getConnection() {
    global $configs;
    return new mysqli($configs['serverName'], $configs['username'], $configs['password'], $configs['db_name'],
        $configs['port']);
}

if (isset($_GET['getPokemon_index']) && !empty($_GET['getPokemon_index']) && isset($_GET['getPokemon_level']) && !empty
    ($_GET['getPokemon_level'])
) {
    getPokemon($_GET['getPokemon_index'], $_GET['getPokemon_level']);
} elseif (isset($_GET['getTypeEffectiveness_type1']) && !empty($_GET['getTypeEffectiveness_type1']) && isset
    ($_GET['getTypeEffectiveness_type2']) && !empty($_GET['getTypeEffectiveness_type2'])
) {
    getTypeEffectiveness($_GET['getTypeEffectiveness_type1'], $_GET['getTypeEffectiveness_type2']);
} elseif (isset($_GET['getNatureStatChanges_index']) && !empty($_GET['getNatureStatChanges_index'])) {
    getNatureStatChanges($_GET['getNatureStatChanges_index']);
}