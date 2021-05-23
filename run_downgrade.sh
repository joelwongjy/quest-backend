#!/usr/bin/env bash
if [ $# -ne 1 ]; then
  echo "Please specify the environment."
  echo "$0 -d for development"
  echo "$0 -t for test"
  echo "$0 -s for staging"
  echo "$0 -p for production"
  exit 1
fi

case $1 in
  -d)
    ENV='development'
    ;;
  -t)
    ENV='test'
    ;;
  -s)
    ENV='staging'
    ;;
  -p)
    ENV='production'
    ;;
  *)
    echo 'Unrecognised flag! Please use -d, -t, -s or -p.'
    exit 1
esac

env NODE_ENV="$ENV" yarn typeorm migration:revert
