import sys, json

def move(command):
    record = { 'moves': [command] }
    print(json.dumps(record))
    sys.stdout.flush()

turn = 5    
for line in sys.stdin:
    if turn > 0:
        turn = turn - 1
        state = json.loads(line)
        # find planet with most ships
        my_planets = [p for p in state['planets'] if p['owner'] == 1]
        other_planets = [p for p in state['planets'] if p['owner'] != 1]
        
        if not my_planets or not other_planets:
            move(None)
        else:
            planet = max(my_planets, key=lambda p: p['ship_count'])
            dest = min(other_planets, key=lambda p: p['ship_count'])
            move({
                'origin': planet['name'],
                'destination': dest['name'],
                'ship_count': planet['ship_count'] - 1
            })
