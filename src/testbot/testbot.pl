# use of additional properties is incorrect
# https://github.com/json-schema/json-schema/wiki/Additionalproperties

use warnings;
use strict;
use JSON::Tiny qw(decode_json encode_json);
use Data::Dumper;
use Math::Complex;
use POSIX;
use 5.014;

my %gamestate = ();
my $gamestate_ref = \%gamestate;

{
  # read file content and decode
  undef $/;
  my $content = <>;
  $gamestate_ref = decode_json $content;
}

my @players = @{$$gamestate_ref{"players"}};
my @planets = @{$$gamestate_ref{"planets"}};
my @expeditions = @{$$gamestate_ref{"expeditions"}};

# pick a random player to play as, may change in the future
my $whoami = $players[rand $#players];
say "[*] Hi I will be playing as $whoami";

# find out who owns which planets and keep track of them
# in a hash indexed on playername
my %ownership_planets = map {
  my $playername = $_;
  my @owned = grep {$$_{"owner"} eq $playername} @planets;
  #print Dumper(\@owned);
  $_=>\@owned;
} @players;
#print Dumper(\%ownership_planets);

# a reference to the planets owned by this player
my $whoami_planets = $ownership_planets{$whoami};
my $move_origin_planet = ${$whoami_planets}[rand $#{$whoami_planets}];
say "[$whoami] I will attack from the following planet";
print Dumper($move_origin_planet);
# for now the bot will always use ceil(#ships on planet / 2) to attack
my $move_ship_count = ceil(${$move_origin_planet}{"ship_count"}/2);

#decrement the ship_count on the planet you are leaving
${$move_origin_planet}{"ship_count"} -= $move_ship_count;

# find out which targets are valid, currently any planet except the one we attack from
my @valid_targets = ( grep { $$_{"name"} ne ${$move_origin_planet}{"name"}} @planets);
#print Dumper(\@valid_targets);

# pick a valid target
my $valid_target = $valid_targets[rand $#valid_targets];
say "[$whoami] I have selected this target";
print Dumper($valid_target);

# generate a command, following the JSON schema for a command
my $command = {
  "ship_count" => $move_ship_count,
  "origin" => ${$move_origin_planet}{"name"},
  "destination" => ${$valid_target}{"name"},
};

# encode the command
my $command_json = encode_json($command);

say "[$whoami] I produced the following command: $command_json";

# any command results in an expedition, so the newly generated command is added to the list
push @expeditions ,{
  "ship_count" => $move_ship_count,
  "origin" => ${$move_origin_planet}{"name"},
  "destination" => ${$valid_target}{"name"},
  "owner" => $whoami,
  "turns_remaining" => ceil(
  Dist(
  ${$move_origin_planet}{"x"},
  ${$move_origin_planet}{"y"},
  ${$valid_target}{"x"},
  ${$valid_target}{"y"}
  )
  )
};
#print Dumper(\@expeditions);
say "[$whoami] I pushed this new expedition";

# keep track of the expedtitions of other players, useful to add logic in the future
# respond to other player's movements
my %ownership_expeditions = map {
  my $playername = $_;
  my @owned = grep {$$_{"owner"} eq $playername} @expeditions;
  $_=>\@owned;
} @players;

# small subroutine to find distance between two points
sub Dist {
  my @P1 = (@_[0,1]);
  my @P2 = (@_[2,3]);
  #print Dumper(\@P1,\@P2);
  return sqrt(($P1[0]-$P2[0])*($P1[0]-$P2[0])+($P1[1]-$P2[1])*($P1[1]-$P2[1]));
}
