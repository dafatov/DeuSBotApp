ALTER TABLE audit
    ALTER COLUMN category TYPE varchar;

DROP TYPE IF EXISTS audit_category;

CREATE TYPE audit_category AS enum (
    'player',
    'uncategorized',
    'init',
    'auditor',
    'database',
    'api',
    'permission',
    'command'
    );

ALTER TABLE audit
    ALTER COLUMN category TYPE audit_category USING (category::audit_category)
