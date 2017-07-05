import json, sys, math

def main():
    player = sys.argv[1]

    game_state = json.load(sys.stdin)
    if len(game_state["expeditions"]) != 0:
        return
    own_planets = [planet["planet"] for planet in game_state["planets"]
                    if planet["planet"]["owner"] == player]
    other_planets = [planet["planet"] for planet in game_state["planets"]
                    if planet["planet"]["owner"] != player]
    (closest_own_planet, closest_other_planet) = find_closest_planet(own_planets, other_planets)
    if closest_own_planet["ship_count"] > closest_other_planet["ship_count"]:
        data = {}
        data["move"] = {}
        data["move"]["origin"] = closest_own_planet["name"]
        data["move"]["destination"] = closest_other_planet["name"]
        data["move"]["ship_count"] = closest_own_planet["ship_count"] - closest_other_planet["ship_count"]
        print(json.dumps(data))


def find_closest_planet(own_planets, other_planets):
    closest_distance = float("inf")
    closest_own_planet = None
    closest_other_planet = None
    for own_planet in own_planets:
        for other_planet in other_planets:
            distance = calculate_distance_between_planets(own_planet, other_planet)
            if distance < closest_distance:
                closest_distance = distance
                closest_own_planet = own_planet
                closest_other_planet = other_planet
    return (closest_own_planet, closest_other_planet)

def calculate_distance_between_planets(first_planet, second_planet):
    return math.sqrt((second_planet["x"] - first_planet["x"])**2
            + (second_planet["y"] - first_planet["y"])**2)

if __name__ == "__main__":
    main()
