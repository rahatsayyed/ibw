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
