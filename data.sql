DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users;

CREATE TABLE companies
(
    handle text PRIMARY KEY,
    name text UNIQUE,
    num_employees INTEGER,
    description text,
    logo_url text
);

INSERT INTO companies
    (handle, name, num_employees)
VALUES
    ('apple', 'Apple Inc', 300),
    ('ibm', 'IBM', 100),
    ('google', 'Google', 1000),
    ('roni', 'Roni Inc', 150);

CREATE TABLE jobs
(
    id serial PRIMARY KEY,
    title text NOT NULL,
    salary float NOT NULL,
    equity float NOT NULL CHECK (equity <=1 and equity >=0),
    company_handle text NOT NULL REFERENCES companies ON DELETE CASCADE,
    date_posted date DEFAULT CURRENT_DATE NOT NULL
);
INSERT INTO jobs
    (title, salary, equity, company_handle)
VALUES
    ('SE', 1000000, 0.5, 'apple' ),
    ('accounting', 100, 0.1, 'ibm' ),
    ('IT', 148598, 0.2, 'google' ),
    ('HR', 3740, 0.01, 'roni' );

CREATE TABLE users
(
    username text PRIMARY KEY,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    photo_url text,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL
);
INSERT INTO users
    (username, password, first_name, last_name, email, is_admin)
VALUES
    ('roni', '123456', 'roni', 'h', 'rh@abcdefghijklmon.com', true),
    ('gin', '123456', 'gin', 'w', 'gw@abcdefghijklmon.com', true),
    ('joe', '123456', 'joe', 'a', 'ja@yay.com', false),
    ('michael', '123456', 'mic', 'b', 'mb@ohno.com', false);


CREATE TABLE applications
(
    username text REFERENCES users ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs ON DELETE CASCADE,
    state text NOT NULL,
    created_at TIMESTAMP default CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (username, job_id) 
);
INSERT INTO applications
    (username, job_id, state)
VALUES
    ('joe', 1, 'pending'),
    ('gin', 2, 'applied');

