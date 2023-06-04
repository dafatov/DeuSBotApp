ALTER TABLE statistics
    ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

ALTER TABLE statistics
    ALTER COLUMN guild_id TYPE bigint USING guild_id::bigint;
