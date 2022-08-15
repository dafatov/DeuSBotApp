create table publicist
(
    guild_id   bigint not null
        constraint news_channel_pk
            primary key,
    channel_id bigint not null
);
