# Database Migration Instructions

## Quick Setup - Run This SQL in Supabase

1. **Go to your Supabase SQL Editor:**
   https://supabase.com/dashboard/project/gapqnyahyskjjznyocrn/sql/new

2. **Copy and paste the entire contents of:**
   `scripts/create-proposal-system.sql`

3. **Click "Run" to execute**

This will create:
- Package categories table
- Custom packages table  
- Proposals table
- Proposal packages junction table
- All necessary RLS policies
- Seed data with your existing packages

## What This Fixes

Once you run the migration:
- ✅ "Create Proposal" button will work
- ✅ Package Studio will be accessible
- ✅ Proposal tracking in leads will function
- ✅ All automation APIs will be ready

## After Migration

The system will be ready for:
1. Making session types editable
2. Adding discount functionality
3. Full automation with N8N

## Need Help?

If you encounter any errors, the most common issue is that some tables already exist. In that case, you can run the migration in parts or drop existing tables first.