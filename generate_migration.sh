#!/usr/bin/env bash
if [ "$#" -ne 1 ]; then
  echo "Please specify a single-word message"
  echo "e.g. $0 'ChangeFoo'"
  exit 1
fi

env NODE_ENV=development yarn typeorm migration:generate -n "$1"
