create table permission
(
    user_id       varchar not null
        constraint permission_pkey
            primary key,
    is_white_list boolean default true,
    scopes        varchar default '[]'::character varying
);
