#!/bin/bash
#
# Switch www/manifest.json with www/manifest.alt.json

NORM_LOC=www/manifest.json
ALT_LOC=www/manifest.alt.json

# Make copies
echo 'Making temp files'
cat $NORM_LOC > norm_temp
cat $ALT_LOC > alt_temp

# Overwrite
echo 'Overwriting manifest'
cat alt_temp > $NORM_LOC
cat norm_temp > $ALT_LOC

# Remove copies
echo 'Done'
rm norm_temp
rm alt_temp