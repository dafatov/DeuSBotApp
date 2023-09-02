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
    'command',
    'state_update',
    'security',
    'response',
    'publicist',
    'listener',
    'locale',
    'radio'
    );

ALTER TABLE audit
    ALTER COLUMN category TYPE audit_category USING (category::audit_category)
