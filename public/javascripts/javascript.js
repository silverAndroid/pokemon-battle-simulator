var currentState;
var cpuPokemon;
var userPokemon;
var api = new API();

var cpuTurn = {
    play: function () {
        var randomIndex = Math.floor(Math.random() * 4);
        var selectedMove = cpuPokemon.moves[randomIndex];
        var $attackImg = $("#attack-img");

        var setUpCPUField = function () {
            $("#chat-text").text("What will " + cpuPokemon.name + " do?");
            prepareToAttack();
        };

        var prepareToAttack = function () {
            $("#cpu-pokemon-img").animate({
                bottom: "+=25"
            }, 200, function () {
                $("#cpu-pokemon-img").animate({
                    bottom: "-=25"
                }, 200)
            });
            getAccuracy();
        };

        var getAccuracy = function () {
            var accuracy = Math.random();
            if (accuracy <= selectedMove.accuracy / 100) {
                $("#chat-text").text(cpuPokemon.name + " used " + selectedMove.name + "!");
                getMoveType();
            } else {
                $("#chat-text").text(cpuPokemon.name + " missed with " + selectedMove.name + "!");
                currentState = playerTurn;
                setTimeout(gameLoop, 1500)
            }
        };

        var getMoveType = function () {
            showMoveAnimation();

            if (selectedMove.status == "status") {
                setTimeout(defensiveMove, 1500);
            } else {
                setTimeout(attackingMove, 1500);
            }
        };

        var fade = function (id, time, num) {
            for (var i = 0; i < num; i++) {
                id.fadeIn(time).fadeOut(time);
            }
        };

        var showMoveAnimation = function () {
            $attackImg.addClass("cpu-attack-img");
            $attackImg.removeClass("hide");
            fade($attackImg, 100, 4);
        };

        var attackingMove = function () {
            $attackImg.addClass("hide");
            $attackImg.removeClass("cpu-attack-img");
            getModifier(selectedMove, cpuPokemon, userPokemon);
        };

        var defensiveMove = function () {
            $attackImg.addClass("hide");
            $attackImg.removeClass("cpu-attack-img");
            userPokemon.effect = selectedMove.power;
            currentState = playerTurn;
            gameLoop();
        };

        setUpCPUField();
    }
};

var playerTurn = {
    play: function () {
        var selectedMove;
        var $attackImg = $("#attack-img");
        var $chatText = $("#chat-text");

        var setUpMoves = function () {
            $chatText.addClass("hide");
            var moveButtons = [$("#move-1-text"), $("#move-2-text"), $("#move-3-text"), $("#move-4-text")];

            $("#button-area").removeClass("hide");

            userPokemon.moves[0] = {name: 'Recover', meta_category: 'heal'};

            for (var i = 0; i < 4; i++) {
                moveButtons[i].text(userPokemon.moves[i].name);
            }
        };

        $("#move-1-button, #move-2-button, #move-3-button, #move-4-button").unbind().click(function () {
            var moveIndex = $(this).attr("value");
            selectedMove = userPokemon.moves[moveIndex];
            api.db.parseMove(selectedMove.name, function (response) {
                if (response['status'] == 200) {
                    switch (response['meta_category']) {
                        case 'damage':
                            prepareToAttack(response['meta_category']);
                            break;
                        case 'ailment':
                            setAilment(response['name']);
                            break;
                        case 'net-good-stats':
                            changeStat(response['name']);
                            break;
                        case 'heal':
                            heal(response['healing']);
                            break;
                        case 'damage+ailment':
                            prepareToAttack(response['meta_category'], response['meta_ailment'],
                                response['ailment_chance']);
                            break;
                        case 'damage+lower':
                            prepareToAttack(response['meta_category'], response['name'],
                                response['stat_chance']);
                            break;
                        case 'damage+raise':
                            prepareToAttack(response['meta_category'], response['name'],
                                response['stat_chance']);
                            break;
                        case 'damage+heal':
                            prepareToAttack(response['meta_category'], response['meta_ailment'],
                                response['drain']);
                            break;
                        case 'swagger':
                            break;
                        case 'ohko':
                            break;
                        case 'whole-field-effect':
                            break;
                        case 'field-effect':
                            break;
                        case 'force-switch':
                            break;
                        default:
                            break;
                    }
                } else {
                    displayError(response);
                }
            });
        });

        /**
         *
         * @param category comes from meta_category (damage, ailment, net-good-stats, heal, damage+ailment,
         * swagger, damage+lower, damage+raise, damage+heal, ohko, whole-field-effect, field-effect,
         * force-switch, unique)
         * @param ailment comes from meta_ailment (unknown, none, paralysis, sleep, freeze, burn, poison,
         * confusion, infatuation, trap, nightmare, torment, disable, yawn, heal-block, no-type-immunity,
         * leech-seed, embargo, perish-song, ingrain) or name of move if it's a stat change
         * @param chance probability that it occurs or amount that it will heal user by
         */
        var prepareToAttack = function (category, ailment, chance) {
            $("#button-area").addClass("hide");

            $("#user-pokemon-img").animate({
                bottom: "+=25"
            }, 200, function () {
                $("#user-pokemon-img").animate({
                    bottom: "-=25"
                }, 200)
            });

            if (getAccuracy(selectedMove.accuracy)) {
                $chatText.text(userPokemon.name + " used " + selectedMove.name + "!");
                getMoveType(category, ailment, chance);
            } else {
                $chatText.text(userPokemon.name + " missed with " + selectedMove.name + "!");
                currentState = cpuTurn;
                setTimeout(gameLoop, 1500);
            }
        };

        var setAilment = function (ailment, chance) {
            userPokemon[ailment] = ailment;
        };

        var changeStat = function (stat, change) {
            console.log(stat + " " + change);
            // reduce stat
            if (change < 0) {
                userPokemon[stats_modified][stat]--;
            } else {
                userPokemon[stats_modified][stat]++;
            }
        };

        var heal = function (percentage) {
            userPokemon['health'] += percentage / 100 * userPokemon['stats']['hp'];
            if (userPokemon['health'] > userPokemon['stats']['hp']) {
                userPokemon['health'] = userPokemon['stats']['hp'];
            }
            changeHPBar(userPokemon);
        };

        var getAccuracy = function (accuracy) {
            var random = Math.random();
            return random <= (accuracy / 100);
        };

        var getMoveType = function (category, ailment, chance) {
            showMoveAnimation();

            if (category != 'damage') {
                var extraCategory = category.split('+');
                switch (extraCategory[1]) {
                    case 'ailment':
                        setAilment(ailment, chance);
                        break;
                    case 'raise':
                    case 'lower':
                        changeStat(ailment, chance);
                        break;
                    case 'heal':
                        heal(chance);
                        break;
                }
            }
            decideMove();
        };

        var fade = function (id, time, num) {
            for (var i = 0; i < num; i++) {
                id.fadeIn(time).fadeOut(time);
            }
        };

        var showMoveAnimation = function () {
            $attackImg.addClass("user-attack-img");
            $attackImg.removeClass("hide");
            fade($attackImg, 100, 4);
        };

        var decideMove = function () {
            if (selectedMove.status == "status") {
                setTimeout(defensiveMove, 1500);
            } else {
                setTimeout(attackingMove, 1500);
            }
        };

        var attackingMove = function () {
            $attackImg.addClass("hide");
            $attackImg.removeClass("user-attack-img");
            getModifier(selectedMove, userPokemon, cpuPokemon);
        };

        var defensiveMove = function () {
            $attackImg.addClass("hide");
            $attackImg.removeClass("user-attack-img");
            cpuPokemon.effect = selectedMove.power;
            currentState = cpuTurn;
            gameLoop();
        };

        setUpMoves();
    }
};

var calculateDamage = function (modifier, move, pokemon, enemyPokemon) {
    var attack = move.status == 'physical' ? pokemon.stats['attack'] : pokemon.stats['special_attack'];
    var defense = move.status == 'physical' ? enemyPokemon.stats['defense'] :
        enemyPokemon.stats['special_defense'];
    var damage = Math.floor(modifier * (((2 * pokemon['level'] + 10) / 250) * attack / defense *
        (move['power']) + 2));
    console.log(damage);
    enemyPokemon.health -= damage;
    changeHPBar(enemyPokemon);
    gameLoop();
};

var getModifier = function (move, pokemon, enemyPokemon) {
    var random = Math.random() * .15 + .85;
    var stab = move.type == pokemon.type ? 1.5 : 1;
    var type = function () {
        api.db.getTypeEffectiveness(move.type, enemyPokemon.type, function (response) {
            if (response['status'] == 200)
                calculateDamage(random * stab * response['effectiveness'], move, pokemon, enemyPokemon);
            else
                displayError(response);
        });
    };
    type();
};

var loadPokemon = function (variable, index, level) {
    api.db.getPokemon(level, index, function (response) {
        if (response['status'] == 200) {
            console.log(response);
            generateStats(variable, response);
        } else {
            displayError(response);
        }
    });
};

var changeHPBar = function (pokemon) {
    if (pokemon == cpuPokemon) {
        console.log("HP: " + cpuPokemon.health / cpuPokemon.stats['hp'] * 100 + "%");
        $("#cpu-hp").css("width", cpuPokemon.health / cpuPokemon.stats['hp'] * 100 + "%");
        currentState = cpuTurn;
    } else {
        console.log("HP: " + userPokemon.health / userPokemon.stats['hp'] * 100 + "%");
        $("#user-hp").css("width", userPokemon.health / userPokemon.stats['hp'] * 100 + "%");
        currentState = playerTurn;
    }
};

var displayError = function (error) {
    console.log(error);
    $("#error_message").html("HTTP " + error['status'] + "<br />" + error['reason']);
};

var setPokemon = function (variable, data) {
    var downloadingImage = new Image;
    var image = null;
    if (variable == cpuPokemon) {
        image = document.getElementById('cpu-pokemon-img');
        cpuPokemon = data;
        $("#cpu-name").text(cpuPokemon.name);
        $("#cpu-lvl").text("lvl " + cpuPokemon.level);
        $("#cpu-hp").css("width", "100%");
        downloadingImage.onload = function () {
            console.log("Cpu pokemon image loaded");
            image.src = this.src;
            image.classList.remove("hide");
        };
        downloadingImage.src = "images/front/" + cpuPokemon.name.toLowerCase().replace(".", "")
                .replace(" ", "-").latinise() + ".gif";
    } else if (variable == userPokemon) {
        image = document.getElementById('user-pokemon-img');
        userPokemon = data;
        $("#user-name").text(userPokemon.name);
        $("#user-lvl").text("lvl " + userPokemon.level);
        $("#user-hp").css("width", "100%");
        downloadingImage.onload = function () {
            console.log("user pokemon loaded");
            image.src = this.src;
            image.classList.remove("hide");
        };
        downloadingImage.src = "images/back/" + userPokemon.name.toLowerCase()
                .replace(".", "").replace(" ", "-").latinise() + ".gif";
    }
    if (cpuPokemon != null && userPokemon != null) {
        currentState = playerTurn;
        gameLoop();
    }
};

var generateStats = function (variable, pokemon) {
    var index = Math.floor(Math.random() * 25) + 1;
    api.db.getNatureStatChanges(index, function (response) {
        if (response['status'] == 200) {
            var natureModifier = [1, 1, 1, 1, 1, 1];
            var statsModifier = {
                attack: 1,
                defense: 1,
                special_attack: 1,
                special_defense: 1,
                speed: 1,
                hp: 1
            };
            natureModifier[response.increased_stat_index - 1] += 0.1;
            natureModifier[response.decreased_stat_index - 1] -= 0.1;
            var IVs = generateIVs();
            var statNames = ['attack', 'defense', 'special_attack', 'special_defense', 'speed', 'hp'];
            var stats = {
                attack: 0,
                defense: 0,
                special_attack: 0,
                special_defense: 0,
                speed: 0,
                hp: 0
            };
            for (var i = 0; i < 6; i++) {
                stats[statNames[i]] = generateStat(pokemon.base_stats[(i + 1) % 6], IVs[statNames[i]], statNames[i], pokemon.level, natureModifier[i]);
            }
            pokemon['stats'] = stats;
            pokemon['stats_modified'] = statsModifier;
            pokemon['health'] = stats['hp'];
            delete pokemon.base_stats;
            chooseMoves(variable, pokemon)
        } else {
            displayError(response);
        }
    });
};

var chooseMoves = function (variable, pokemon) {
    var chosenMoves = [];
    for (var i = 0; i < 4; i++) {
        var chosenMove = Math.floor(Math.random() * pokemon.moves.length);
        chosenMoves.push(pokemon.moves[chosenMove]);
        pokemon.moves.splice(chosenMove, 1);
    }
    pokemon.moves = chosenMoves;
    setPokemon(variable, pokemon);
};

var generateIVs = function () {
    return {
        attack: Math.floor(Math.random() * 32),
        defense: Math.floor(Math.random() * 32),
        special_attack: Math.floor(Math.random() * 32),
        special_defense: Math.floor(Math.random() * 32),
        speed: Math.floor(Math.random() * 32),
        hp: Math.floor(Math.random() * 32)
    };
};

var generateStat = function (baseStat, IV, statName, level, nature) {
    var stat = 0;
    statName = statName.replace(" ", "_");
    if (statName == 'hp') {
        stat = Math.floor((2 * baseStat[statName] + IV + parseInt(baseStat['effort'])) * parseInt(level) / 100 + parseInt(level) + 10);
    } else {
        stat = Math.floor(Math.floor((2 * baseStat[statName] + IV + parseInt(baseStat['effort'])) * level / 100 + 5) * nature);
    }
    return stat;
};

var init = function () {
    $('#cpu-pokemon-img').addClass("hide");
    $('#user-pokemon-img').addClass("hide");
    loadPokemon(cpuPokemon, Math.floor(Math.random() * 721 + 1), Math.floor(Math.random() * 100 + 1));
    loadPokemon(userPokemon, Math.floor(Math.random() * 721 + 1), Math.floor(Math.random() * 100 + 1));
    //loadPokemon(cpuPokemon, Math.floor(Math.random() * 721 + 1), 100);
    //loadPokemon(userPokemon, Math.floor(Math.random() * 721 + 1), 100);
};

var gameLoop = function () {
    if (cpuPokemon != null && userPokemon != null)
        if (cpuPokemon.health <= 0 || userPokemon.health <= 0) {
            $("#game-over").removeClass("hide");
            $("#play-again").removeClass("hide");
            console.log("Game Over!");
        } else {
            $("#game-over").addClass("hide");
            $("#play-again").addClass("hide");
            currentState.play();
        }
};

init();