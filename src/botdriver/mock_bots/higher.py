import sys

for line in iter(sys.stdin.readline, ''):
    print('{"answer":"HIGHER"}')
    sys.stdout.flush()