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
  undef $/;
  my $content = <>;
  $gamestate_ref = decode_json $content;
}

my @players = @{$$gamestate_ref{"players"}};
my @planets = @{$$gamestate_ref{"planets"}};
my @expeditions = @{$$gamestate_ref{"expeditions"}};

my $whoami = $players[rand $#players];
say "[*] Hi I will be playing as $whoami";

my %ownership_planets = map {
  my $playername = $_;
  my @owned = grep {$$_{"owner"} eq $playername} @planets;
  #print Dumper(\@owned);
  $_=>\@owned;
} @players;
#print Dumper(\%ownership_planets);

my $whoami_planets = $ownership_planets{$whoami};
my $move_origin_planet = ${$whoami_planets}[rand $#{$whoami_planets}];
say "[$whoami] I will attack from the following planet";
print Dumper($move_origin_planet);
my $move_ship_count = ceil(${$move_origin_planet}{"ship_count"}/2);

#decrement the ship_count on the planet you are leaving
${$move_origin_planet}{"ship_count"} -= $move_ship_count;


my @valid_targets = ( grep { $$_{"name"} ne ${$move_origin_planet}{"name"}} @planets);
#print Dumper(\@valid_targets);

my $valid_target = $valid_targets[rand $#valid_targets];
say "[$whoami] I have selected this target";
print Dumper($valid_target);

my $command = {
  "ship_count" => $move_ship_count,
  "origin" => ${$move_origin_planet}{"name"},
  "destination" => ${$valid_target}{"name"},
};

my $command_json = encode_json($command);

say "[$whoami] I produced the following command: $command_json";


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


my %ownership_expeditions = map {
  my $playername = $_;
  my @owned = grep {$$_{"owner"} eq $playername} @expeditions;
  $_=>\@owned;
} @players;


sub Dist {
  my @P1 = (@_[0,1]);
  my @P2 = (@_[2,3]);
  #print Dumper(\@P1,\@P2);
  return sqrt(($P1[0]-$P2[0])*($P1[0]-$P2[0])+($P1[1]-$P2[1])*($P1[1]-$P2[1]));
}
