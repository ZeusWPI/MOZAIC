import sys, json

def get_input():
    for line in sys.stdin:
        yield json.loads(line)

while True:
    j = get_input()
    for d in j:
        print('{}')
        sys.stdout.flush()