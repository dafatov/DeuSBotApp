ALTER TABLE queue
    ALTER COLUMN type TYPE varchar;

DROP TYPE IF EXISTS song_type;

CREATE TYPE song_type AS enum (
    'youtube',
    'radio',
    'file'
    );

ALTER TABLE queue
    ALTER COLUMN type TYPE song_type USING (type::song_type)
