create table birthday
(
    user_id bigint                not null
        constraint birthday_pk
            primary key,
    date    date,
    ignored boolean default false not null
);
