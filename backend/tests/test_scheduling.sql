
BEGIN;

DO $$
DECLARE
    test_user UUID := gen_random_uuid();
    test_committee UUID := gen_random_uuid();
    hall_a UUID := gen_random_uuid();
    hall_b UUID := gen_random_uuid();

BEGIN
    -- Test-only user. No real password is used.
    INSERT INTO users (
        id, full_name, email, password_hash, user_type
    )
    VALUES (
        test_user,
        'Test Faculty',
        test_user::text || '@example.invalid',
        'TEST_ONLY_NOT_A_VALID_HASH',
        'faculty'
    );

    INSERT INTO committees (id, name)
    VALUES (test_committee, 'Estrade Test Committee');

    INSERT INTO venues (id, name, capacity)
    VALUES
        (hall_a, 'Test Auditorium', 200),
        (hall_b, 'Test Seminar Hall', 100);

    -- First confirmed booking
    INSERT INTO events (
        id, title, committee_id, venue_id,
        created_by, starts_at, ends_at, status
    )
    VALUES (
        gen_random_uuid(), 'Event A',
        test_committee, hall_a, test_user,
        '2026-10-15 10:00:00+05:30',
        '2026-10-15 12:00:00+05:30',
        'confirmed'
    );

    -- TEST 1: Same venue, overlapping time
    BEGIN
        INSERT INTO events (
            id, title, committee_id, venue_id,
            created_by, starts_at, ends_at, status
        )
        VALUES (
            gen_random_uuid(), 'Conflicting Event',
            test_committee, hall_a, test_user,
            '2026-10-15 11:00:00+05:30',
            '2026-10-15 13:00:00+05:30',
            'confirmed'
        );

        RAISE EXCEPTION 'FAIL: Conflict was accepted!';

    EXCEPTION WHEN exclusion_violation THEN
        RAISE NOTICE 'PASS: Overlapping event rejected';
    END;

    -- TEST 2: Back-to-back event
    INSERT INTO events (
        id, title, committee_id, venue_id,
        created_by, starts_at, ends_at, status
    )
    VALUES (
        gen_random_uuid(), 'Adjacent Event',
        test_committee, hall_a, test_user,
        '2026-10-15 12:00:00+05:30',
        '2026-10-15 14:00:00+05:30',
        'confirmed'
    );

    RAISE NOTICE 'PASS: Adjacent event accepted';

    -- TEST 3: Another venue at the same time
    INSERT INTO events (
        id, title, committee_id, venue_id,
        created_by, starts_at, ends_at, status
    )
    VALUES (
        gen_random_uuid(), 'Other Venue Event',
        test_committee, hall_b, test_user,
        '2026-10-15 11:00:00+05:30',
        '2026-10-15 13:00:00+05:30',
        'confirmed'
    );

    RAISE NOTICE 'PASS: Different venue accepted';

    -- TEST 4: Draft events do not reserve venues
    INSERT INTO events (
        id, title, committee_id, venue_id,
        created_by, starts_at, ends_at, status
    )
    VALUES (
        gen_random_uuid(), 'Draft Event',
        test_committee, hall_a, test_user,
        '2026-10-15 11:00:00+05:30',
        '2026-10-15 13:00:00+05:30',
        'draft'
    );

    RAISE NOTICE 'PASS: Overlapping draft accepted';

END $$;

-- Inspect the relationships using JOIN
SELECT
    e.title,
    c.name AS committee,
    v.name AS venue,
    e.status
FROM events e
JOIN committees c ON e.committee_id = c.id
JOIN venues v ON e.venue_id = v.id
WHERE c.name = 'Estrade Test Committee';

-- Discard all temporary test data
ROLLBACK;

