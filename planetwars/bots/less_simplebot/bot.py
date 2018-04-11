import sys
import json
import math


def write_moves(moves):
    record = {'moves': moves}
    print(json.dumps(record))
    sys.stdout.flush()


def move(mine, target, amount):
    return {'origin': mine['name'],
            'destination': target['name'],
            'ship_count': amount
            }


def distance(first, second):
    return math.sqrt((first['x'] - second['x'])**2 + (first['y'] - second['y'])**2)


for line in sys.stdin:
    state = json.loads(line)
    moves = []

    my_planets = [p for p in state['planets'] if p['owner'] == 1]
    unowned_planets = [p for p in state['planets'] if p['owner'] is None]
    other_planets = [p for p in state['planets'] if p['owner'] != 1]

    # Send all ships except one to the closest planet
    # Prioritises planets that have no owner (and will not grow in strength)
    for mine in my_planets:
        if unowned_planets:
            target = min(unowned_planets, key=lambda p: distance(p, mine))
            moves.append(move(mine, target, mine['ship_count'] - 1))
        elif other_planets:
            target = min(other_planets, key=lambda p: distance(p, mine))
            moves.append(move(mine, target, mine['ship_count'] - 1))
    write_moves(moves)

