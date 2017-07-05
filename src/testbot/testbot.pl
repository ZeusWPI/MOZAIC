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

print Dumper($$gamestate_ref{"properties"});
