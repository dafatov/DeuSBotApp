create table changelog
(
    version     bigint                not null,
    message     varchar               not null,
    shown       boolean default false not null,
    application changelog_application not null,
    constraint changelog_pk
        primary key (version, application)
);
