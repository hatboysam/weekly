#!/bin/bash

# Uninstall old
echo 'Uninstalling...'
adb uninstall com.habosa.weekly

# Install new
adb install platforms/android/bin/Weekly-release.apk
