use strict;
use warnings;
use 5.014;
use JSON::Tiny;
use Data::Dumper;

my $playercount = shift @ARGV;
my $planetcount = shift @ARGV;
my $owned_on_start = shift @ARGV;
my $x_bound = shift @ARGV;
my $y_bound = shift @ARGV;

if($#ARGV != 5){
  say "Usage:\n
  worldcreator.pl [playercount] [planetcount] [planets owned at start] [X map bound] [Y map bound]";
}

use constant PLAYER_NAME_LENGTH => 8;
use constant PLANET_NAME_LENGTH => 10;



my %world = (
"players" => [],
"planets" => [],
"expeditions" => []
);

my %players = ();
my $i = chr(int(rand 26)+ord('A'));
my $playername = "";
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

@{$world{"players"}} = keys %players;

print Dumper(\%world);

my $planet = {
  "x"=>0,
  "y"=>0,
  "ship_count"=>0,
  "owner"=>"",
  "name="=>""
};

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
    $Xplanet = $X[$X_choice];
    splice(@X,$X_choice,1);
    $Yplanet = $Y[$Y_choice];
    splice(@Y,$Y_choice,1);
    $$planet{"x"} = $X_choice;
    $$planet{"y"} = $Y_choice;
    # A planet name
    for my $k (1..PLANET_NAME_LENGTH){
      $planetname .= $i;
      $i = chr(int(rand 26)+ord('A'));
    }
    $$planet{"name"} = $planetname;
    push @planets,$planet;
    $planetname = "";
  }
}

print Dumper(\@planets);

#for my $j (1..$planetcount)
