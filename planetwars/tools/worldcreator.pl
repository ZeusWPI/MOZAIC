use strict;
use warnings;
use 5.014;
use JSON::Tiny qw(encode_json);
use Data::Dumper;

if($#ARGV+1 != 5 || $ARGV[0] > $ARGV[1]){
  say "Usage:
  worldcreator.pl [playercount] [planetcount] [planets owned at start] [X map bound] [Y map bound]";
  die;
}
say "::: Worldcreator for planetwars :::";
my $playercount = shift @ARGV;
my $planetcount = shift @ARGV;
my $owned_on_start = shift @ARGV;
my $x_bound = shift @ARGV;
my $y_bound = shift @ARGV;

# This program creates a world for the planetwars game
# overlap in names / coordinates has been made impossible

use constant PLAYER_NAME_LENGTH => 8;
use constant PLANET_NAME_LENGTH => 10;

# This is the datastructure that will be gradually filled and finally outputted as JSON
my %world = (
"players" => [],
"planets" => [],
"expeditions" => []
);

say "::: Generating unique players :::";

my %players = ();
my $i = chr(int(rand 26)+ord('A'));
my $playername = "";
# the outer while loop is to avoid the extremely rare case in which two players are generated
# with the same name, which would break the game
while(scalar keys %players != $playercount){
  for my $j (1..$playercount){
    for my $k (1..PLAYER_NAME_LENGTH){
      $playername .= $i;
      $i = chr(int(rand 26)+ord('A'));
    }
    $players{$playername}="";
    $playername = "";
  }
}

# interpret $world{"players"} as array and store the player names there
@{$world{"players"}} = keys %players;

#print Dumper(\%world);

# description of a planet
my $planet = {
  "x"=>0,
  "y"=>0,
  "ship_count"=>0,
  "owner"=>"",
  "name"=>""
};

say "::: Generating unique planets :::";

# planets receive unique names
# planets receive unique coordinates within the specified borders
my @planets = ();
$i = chr(int(rand 26)+ord('A'));
my $planetname = "";
my @X = (0..$x_bound);
my @Y = (0..$y_bound);
my $Xplanet = 0;
my $Yplanet = 0;

while (scalar @planets != $planetcount){
  for my $j (1..$planetcount){
    # X & Y
    my $X_choice = rand $#X;
    my $Y_choice = rand $#Y;
    $Xplanet = int($X[$X_choice]);
    $Yplanet = int($Y[$Y_choice]);
    $$planet{"x"} = $Xplanet;
    $$planet{"y"} = $Yplanet;
    splice(@X,$X_choice,1);
    splice(@Y,$Y_choice,1);
    # A planet name
    for my $k (1..PLANET_NAME_LENGTH){
      $planetname .= $i;
      $i = chr(int(rand 26)+ord('A'));
    }
    $$planet{"name"} = $planetname;
    $$planet{"ship_count"} = 0;
    $$planet{"owner"}="";
    push @planets,$planet;
    $planetname = "";
    $planet = {};
  }
}

# each player gets on planet to start with
# that planet also receives a number of ships (arg)
# all other planets have 0 ships at the start
$i = 0;
for my $k (@planets[0..$playercount-1]){
  ${$k}{"owner"}=(keys %players)[$i];
  ${$k}{"ship_count"}=$owned_on_start;
  $i++;
}
#print Dumper(\@planets);

@{$world{"planets"}} = @planets;

#print Dumper(\%world);

my $encoded = encode_json(\%world);
#say $encoded;
say "::: Encoded to JSON :::";

# the encoded world is written to a new file with a unique name
my $result = `mktemp -p .`;
chomp($result);

open(my $fh,'>',$result);
print $fh "$encoded";

say "::: Finished writing this map to $result :::";
