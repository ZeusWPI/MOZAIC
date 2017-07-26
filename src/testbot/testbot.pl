# use of additional properties is incorrect
# https://github.com/json-schema/json-schema/wiki/Additionalproperties

use warnings;
use strict;
use JSON::Tiny qw(decode_json encode_json);
use Data::Dumper;

my %gamestate = ();
my $gamestate_ref = \%gamestate;

{
  undef $/;
  my $content = <>;
  $gamestate_ref = decode_json $content;
}

#print Dumper($gamestate_ref);

#print Dumper($$gamestate_ref{"players"});

print Dumper($$gamestate_ref{"planets"});
print Dumper($$gamestate_ref{"planets"}[0]);
