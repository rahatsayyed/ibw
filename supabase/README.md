# Database Migration Instructions

## Running the Migration in Supabase

1. **Go to your Supabase Project**

   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration**

   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**

   - Click "Run" or press `Cmd/Ctrl + Enter`
   - Wait for completion
   - You should see "Success. No rows returned"

5. **Verify Tables Created**

   - Go to "Table Editor" in the left sidebar
   - You should see all the following tables:
     - users
     - projects
     - project_submissions
     - disputes
     - arbitrators
     - notifications
     - project_history

6. **Confirm RLS is Disabled**
   - For each table, click the settings icon
   - Verify "Enable RLS" is turned OFF

## Environment Variables

Already configured in your `.env`:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_PUBLISHABLE_KEY` - Your Supabase anon/public key

## Next Steps

After running the migration:

1. Test the authentication pages: `/auth/login` and `/auth/signup`
2. Verify database connections are working
3. Start implementing the project features

---

# Database Seed Files

This directory contains seed data for the Cardano Freelance Platform (Talendro).

## Files

### `seed.sql`

Main seed file that populates the database with:

- **10 Users**: Various roles (developers, clients, auditors, designers)
- **25 Projects**: Mix of open, accepted, and disputed projects with realistic data
- **6 Disputes**: Sample disputes with AI analysis and different states

### `auth_seed.sql`

Authentication setup file that creates:

- Auth users in `auth.users` table
- Login credentials for all 10 seed users

## Seed Data Usage

### Method 1: Via Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run `seed.sql` first:
   - Copy and paste the contents of `seed.sql`
   - Click **Run**
4. Run `auth_seed.sql` second:
   - Copy and paste the contents of `auth_seed.sql`
   - Click **Run**

### Method 2: Via Supabase CLI

```bash
# Ensure you're in the project root
cd /Users/copods/Documents/Projects/personal/ibw

# Run the main seed file
supabase db reset

# Or apply just the seed
npx supabase db execute --file ./supabase/seed.sql

# Then run the auth seed
npx supabase db execute --file ./supabase/auth_seed.sql
```

## Login Credentials

All users have the same password for easy testing: `password123`

| Email               | Username        | Role/Bio                 |
| ------------------- | --------------- | ------------------------ |
| alice@example.com   | alice_dev       | Full-stack Developer     |
| bob@example.com     | bob_client      | Project Manager/Client   |
| charlie@example.com | charlie_audit   | Security Auditor         |
| diana@example.com   | diana_design    | UI/UX Designer           |
| ethan@example.com   | ethan_backend   | Backend Developer        |
| fiona@example.com   | fiona_aiken     | Smart Contract Developer |
| george@example.com  | george_devops   | DevOps Engineer          |
| hannah@example.com  | hannah_frontend | Frontend Developer       |
| ian@example.com     | ian_qa          | QA Engineer              |
| julia@example.com   | julia_data      | Data Scientist           |

## Project Data

The seed includes 25 projects covering various categories:

- **DeFi**: Dashboards, lending protocols, DEX integrations
- **NFT**: Marketplaces, minting platforms, gaming assets
- **Smart Contracts**: Aiken development, audits, governance
- **Infrastructure**: CI/CD, DevOps, testing frameworks
- **UI/UX**: Design systems, portfolio trackers, documentation

### Project Statuses:

- **Open**: 20 projects available for freelancers to accept
- **Accepted**: 2 projects currently in progress
- **Disputed**: 5 projects with active disputes (for testing dispute resolution)

## Skills Filter Testing

The skills filter now supports comma-separated values. Try these examples in the gigs page:

- `react, node`
- `aiken, plutus, rust`
- `frontend, ui, design`

Each skill will create a separate filter chip that can be removed individually.

## Notes

- The `seed.sql` file uses `TRUNCATE CASCADE` to clear existing data
- All financial amounts are in lovelace (1 ADA = 1,000,000 lovelace)
- User IDs are fixed UUIDs for consistency
- Reputation scores range from 450 to 950
- Projects include realistic GitHub URLs, descriptions, and success criteria
- Disputes include AI analysis with confidence scores and reasoning
