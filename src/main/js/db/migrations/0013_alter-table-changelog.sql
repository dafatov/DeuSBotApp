alter table changelog
    alter column version type varchar using version::varchar;
