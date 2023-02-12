truncate statistics;

alter table statistics
    add guild_id varchar not null;

alter table statistics
    drop constraint statistics_pkey;

alter table statistics
    add constraint statistics_pkey
        primary key (user_id, guild_id);
