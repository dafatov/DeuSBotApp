CREATE TABLE snapshots
(
    id       bigserial
        CONSTRAINT snapshots_pk
            PRIMARY KEY,
    "table"  varchar                                            NOT NULL,
    guild_id bigint,
    date     timestamp WITH TIME ZONE DEFAULT current_timestamp NOT NULL,
    data     jsonb                    DEFAULT '[]'::jsonb       NOT NULL
);
