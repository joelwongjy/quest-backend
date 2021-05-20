#!/usr/bin/env bash
sudo -u postgres psql -c "DROP DATABASE quest"
sudo -u postgres psql -c "DROP DATABASE quest_test"
sudo -u postgres psql -c "DROP ROLE quest"
sudo -u postgres psql -c "CREATE ROLE quest WITH LOGIN PASSWORD 'quest'"
sudo -u postgres psql -c "CREATE DATABASE quest"
sudo -u postgres psql -c "CREATE DATABASE quest_test"
