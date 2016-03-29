#!/bin/bash

PREFIX="$CACHE/cmake-$CMAKE_VERSION"
if [[ ! -f "$PREFIX/bin/cmake" || -n "$UPDATE_CACHE" ]] ; then
  rm -fr "$PREFIX"
  mkdir -p "$PREFIX"
  curl -L "http://cmake.org/files/v${CMAKE_SHORT_VERSION}/cmake-${CMAKE_VERSION}-Linux-x86_64.tar.gz" | gunzip -c | tar -x -C "$PREFIX" --strip-components 1
fi
export PATH="$PREFIX/bin:$PATH"
