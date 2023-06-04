ALTER TABLE permission
    ALTER COLUMN scopes SET DEFAULT '[]'::jsonb;

ALTER TABLE permission
    ALTER COLUMN scopes TYPE jsonb USING scopes::jsonb;

ALTER TABLE permission
    ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
