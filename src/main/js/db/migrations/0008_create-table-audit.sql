create table audit
(
    id         bigserial
        constraint audit_pk
            primary key,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
    "guildId"  bigint,
    type       audit_type                                         not null,
    category   audit_category                                     not null,
    message    varchar                                            not null
);
