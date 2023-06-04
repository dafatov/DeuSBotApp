ALTER TABLE changelog
    ALTER COLUMN message TYPE jsonb USING message::jsonb;
