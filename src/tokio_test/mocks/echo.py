import sys

for line in iter(sys.stdin.readline, ''):
    print(sys.argv[1] + " " + line)
    sys.stdout.flush()