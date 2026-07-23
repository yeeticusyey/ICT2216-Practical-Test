#!/bin/sh
set -eu

psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE TABLE IF NOT EXISTS common_passwords (
    password TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS "2401416" (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    creation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TEMP TABLE common_password_import (
    password TEXT
);

\copy common_password_import(password) FROM '/docker-entrypoint-initdb.d/100k-most-used-passwords-NCSC.txt' WITH (FORMAT text)

INSERT INTO common_passwords(password)
SELECT DISTINCT password
FROM common_password_import
WHERE password IS NOT NULL
ON CONFLICT DO NOTHING;
SQL

