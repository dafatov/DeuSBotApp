create table statistics
(
    user_id        varchar                               not null
        primary key,
    message_count  integer  default 0                    not null,
    voice_duration interval default '00:00:00'::interval not null
);
