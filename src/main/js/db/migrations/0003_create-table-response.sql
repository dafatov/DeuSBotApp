create table response
(
    guild_id bigint       not null,
    regex    varchar(255) not null,
    react    varchar(255) not null,
    primary key (guild_id, regex)
);
