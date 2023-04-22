create table queue
(
    id       bigserial
        constraint queue_pk
            primary key,
    type     song_type not null,
    title    varchar   not null,
    duration integer   not null,
    url      varchar   not null,
    is_live  boolean   not null,
    preview  varchar,
    user_id  bigint    not null,
    index    integer   not null,
    guild_id bigint    not null,
    constraint queue_u
        unique (index, guild_id)
            deferrable
);
