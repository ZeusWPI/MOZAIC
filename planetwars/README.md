# Planet Wars

## Rules

Planet Wars is a space themed epic strategy game. The goal is to take over all your enemies by sending expeditions of spaceships ready to destroy all resistance.

### The flow

Every turn, your bot receives the [state](#gamestate) of the game.
And every turn, you return the [moves](#moves) you want to make.

### The map

The map is an arbitrary collection of planets on *fixed* positions. They all have an initial amount of ships present (`ship_count`) and can have a neutral owner. Interpret this as an owner who is not a player, and will not make moves, but who's ships you'll have to defeat if you want to take over the planet.

### Combat

Combat is simple, every ship counts equally, and can take out exactly one other ship. When 10 ships collide with 5, 5 will remain of the original 10. When ships of multiple parties collide at the same time, the ships of the party with the lowest ship count are subtracted from all other parties, and this repeat until only 1 (or 0) parties remain. If multiple expeditions of the same party partake in combat, they are treated as 1.

Fighting only happens on planets. In space nobody finds rockets.

Every turn, all player owned planets create one extra ship. This is done before combat is resolved.

### Communication

Your bot is started with it's name as it's first parameter, that way you'll now which player you are in the input you receive. You'll receive that information in newline-separated JSON, and we expect it back the same way.

## Gamestate

The gamestate format is non differential, which implies you'll receive the complete (updated) gamestate every turn, with all information visible for everyone.

Examples:

```json
{
    "planets":[
        {
            "planet":{
                "x":0,
                "y":0,
                "ship_count":4,
                "owner":1,
                "name":"planet_0"
            }
        },
        {
            "planet":{
                "x":10,
                "y":10,
                "ship_count":2,
                "owner":2,
                "name":"planet_1"
            }
        }
    ],
    "expeditions":[
        {
            "ship_count":5,
            "origin":"planet_1",
            "destination":"planet_0",
            "owner":2,
            "turns_remaining":3
        }, {
            "ship_count":7,
            "origin":"planet_0",
            "destination":"planet_1",
            "owner":1,
            "turns_remaining":1
        }
    ]
}
```

## Moves

```json
{
    "moves":[
        {
            "origin":"planet_1",
            "destination": "planet_2",
            "ship_count": 3
        },
        {
            "origin":"planet_2",
            "destination":"planet_1",
            "ship_count": 1
        }
    ]
}
```
