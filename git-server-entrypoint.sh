#!/bin/sh
set -eu

repository="/var/www/git/repository.git"

mkdir -p /var/www/git
chown git:git /var/www/git

if [ ! -d "${repository}/objects" ]; then
    su-exec git git init --bare "${repository}"
fi

chown -R git:git "${repository}"
exec su-exec git "$@"

