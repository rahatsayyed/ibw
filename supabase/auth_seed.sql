-- =====================================================
-- Auth Users Setup for Seed Data
-- =====================================================
-- This file creates auth.users entries for the 10 seed users
-- Password for all users: password123
-- 
-- IMPORTANT: Run this AFTER running the main seed.sql file
-- You may need service role access to insert into auth.users
-- =====================================================

-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert auth users
-- Note: The encrypted_password is generated using crypt function
-- The instance_id should match your Supabase instance

INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES 
-- User 1: Alice
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'alice@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Alice Johnson"}'
),
-- User 2: Bob
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'bob@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Bob Smith"}'
),
-- User 3: Charlie
(
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'charlie@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Charlie Brown"}'
),
-- User 4: Diana
(
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'diana@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Diana Prince"}'
),
-- User 5: Ethan
(
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000000',
  'ethan@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Ethan Hunt"}'
),
-- User 6: Fiona
(
  '66666666-6666-6666-6666-666666666666',
  '00000000-0000-0000-0000-000000000000',
  'fiona@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Fiona Chen"}'
),
-- User 7: George
(
  '77777777-7777-7777-7777-777777777777',
  '00000000-0000-0000-0000-000000000000',
  'george@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "George Wilson"}'
),
-- User 8: Hannah
(
  '88888888-8888-8888-8888-888888888888',
  '00000000-0000-0000-0000-000000000000',
  'hannah@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Hannah Lee"}'
),
-- User 9: Ian
(
  '99999999-9999-9999-9999-999999999999',
  '00000000-0000-0000-0000-000000000000',
  'ian@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Ian Martinez"}'
),
-- User 10: Julia
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'julia@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Julia Roberts"}'
);

-- Insert corresponding auth.identities records
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  id::text,
  id,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email IN (
  'alice@example.com',
  'bob@example.com',
  'charlie@example.com',
  'diana@example.com',
  'ethan@example.com',
  'fiona@example.com',
  'george@example.com',
  'hannah@example.com',
  'ian@example.com',
  'julia@example.com'
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- =====================================================
-- Verify the setup
-- =====================================================
-- SELECT id, email, email_confirmed_at FROM auth.users WHERE email LIKE '%@example.com%';

-- =====================================================
-- Login Credentials for Testing
-- =====================================================
-- Email: alice@example.com    | Password: password123
-- Email: bob@example.com      | Password: password123
-- Email: charlie@example.com  | Password: password123
-- Email: diana@example.com    | Password: password123
-- Email: ethan@example.com    | Password: password123
-- Email: fiona@example.com    | Password: password123
-- Email: george@example.com   | Password: password123
-- Email: hannah@example.com   | Password: password123
-- Email: ian@example.com      | Password: password123
-- Email: julia@example.com    | Password: password123
