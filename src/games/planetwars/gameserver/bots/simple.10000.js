var element, my_planets, enemy_planets, strongest_planet, weakest_enemy, item;


my_planets = getPlanets().filter((element) => element['owner'] == getPlayer());
enemy_planets = getPlanets().filter((element) => element['owner'] != getPlayer());
strongest_planet = maximum_by(my_planets, (element) => element['ship_count']);
weakest_enemy = minimum_by(enemy_planets, (element) => element['ship_count']);
dispatch(strongest_planet['ship_count'], strongest_planet, weakest_enemy);