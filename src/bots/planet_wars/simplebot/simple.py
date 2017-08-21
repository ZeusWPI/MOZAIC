import sys, json

def get_input():
    for line in sys.stdin:
        yield json.loads(line)

while True:
    j = get_input()
    for state in j:
        name = sys.argv[1]
        print('{{"origin":"{}_Base", "destination": "Planet_1", "ship_count": 1}}'.format(name))
        sys.stdout.flush()