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
say "Hi I will be playing as $whoami";

my %ownership_planets = map {
  my $playername = $_;
  
  my @owned = grep {$$_{"owner"} eq $playername} @planets;
  #print Dumper(\@owned);
  $_=>\@owned;
  
} @players;

#print Dumper(\%ownership_planets);


my $whoami_planets = $ownership_planets{$whoami};
say $whoami_planets;
my $move_origin_planet = ${$whoami_planets}[rand $#{$whoami_planets}];
print Dumper($move_origin_planet);
my $move_ship_count = floor(${$move_origin_planet}{"ship_count"}/2);


my @valid_targets = ( grep { $$_{"name"} ne ${$move_origin_planet}{"name"}} @planets);
#print Dumper(\@valid_targets);

my $valid_target = $valid_targets[rand $#valid_targets];
print Dumper($valid_target);



my %ownership_expeditions = map {
  my $playername = $_;
  my @owned = grep {$$_{"owner"} eq $playername} @expeditions;
  $_=>\@owned;
} @players;

#print Dumper(\%ownership_expeditions);

my $res = Dist((0,0,2,1));
say ceil($res);

sub Dist {
  my @P1 = (@_[0,1]);
  my @P2 = (@_[2,3]);
  return sqrt(($P1[0]-$P2[0])*($P1[0]-$P2[0])+($P1[0]-$P2[0])*($P1[0]-$P2[0]));
}
