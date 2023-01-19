create table session
(
    user_id  varchar                                            not null,
    guild_id varchar                                            not null,
    begin    timestamp with time zone default CURRENT_TIMESTAMP not null,
    finish   timestamp with time zone default CURRENT_TIMESTAMP,
    primary key (user_id, guild_id)
);
