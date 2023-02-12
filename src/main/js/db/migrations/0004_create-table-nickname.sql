create table nickname
(
    login    varchar(31) not null
        constraint users_pkey
            primary key,
    nickname varchar(31) not null
        constraint users_nickname_key
            unique
);
