import sys
import json

for line in iter(sys.stdin.readline, ''):
    state = json.loads(line)
    if state["max"] // 2 > state["current"]:
        print('{"answer":"HIGHER"}')
    else:
        print('{"answer":"LOWER"}')
    sys.stdout.flush()