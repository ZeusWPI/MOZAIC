# Planet Wars
It's basically [this](http://armorgames.com/play/2675/phage-wars) game, but a little simpler.

In short:
- The map is made up of planets on a 2d-pane.
- Each player starts on a random planet, with a small number of ships.
- Each turn, an occupied planet builds a ship for its controller (empty planets don't build ships).
  It is added to the fleet residing on the planet.
- Players can command their ships to fly to another planet.
  - They will take `ceil(distance(planet_1, planet_2))` turns to arrive there.
  - When ships arrive at an enemy planet, they will battle. Battles are resolved as follows:
    - Find the player who controls the least ships in the battle.
    - This player loses the battle.
    - Subtract the size of this players fleet from the sizes of the other fleets in the battle.
    - Last remaining player takes control of the planet.
