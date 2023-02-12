update changelog
set version = replace(version, changelog.version, concat('0.0.', changelog.version));
