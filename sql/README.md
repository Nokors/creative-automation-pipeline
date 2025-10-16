# SQL Migration and Setup Scripts

This folder contains all SQL scripts for database setup and migrations.

## Setup Script

### `setup_mysql.sql`
**Purpose:** Initial database setup

Creates the database, user, and grants permissions for the campaigns application.

**Usage:**
```bash
mysql -u root -p < sql/setup_mysql.sql
```

**What it does:**
- Creates `campaigns_db` database
- Creates `campaign_user` with appropriate permissions
- Sets up initial database structure

## Migration Scripts

Migration scripts add new columns or features to existing tables. Run them in chronological order if setting up from scratch, or run only the ones you need for specific features.

### `add_dropbox_columns.sql`
**Purpose:** Add Dropbox integration support

Adds columns for Dropbox backup functionality.

**Adds:**
- `dropbox_uploaded` - Track if campaign images were uploaded to Dropbox
- `dropbox_links` - Store Dropbox file paths and shared links

**Usage:**
```bash
mysql -u root -p campaigns_db < sql/add_dropbox_columns.sql
```

### `add_auto_upload_dropbox_column.sql`
**Purpose:** Add auto-upload to Dropbox flag

Adds column to control automatic Dropbox uploads per campaign.

**Adds:**
- `auto_upload_to_dropbox` - Boolean flag for automatic uploads

**Usage:**
```bash
mysql -u root -p campaigns_db < sql/add_auto_upload_dropbox_column.sql
```

### `add_marketing_channel_column.sql`
**Purpose:** Add marketing channel tracking

Adds column to categorize campaigns by marketing channel.

**Adds:**
- `marketing_channel` - Store channel type (social_media, email, display_ads, etc.)

**Usage:**
```bash
mysql -u root -p campaigns_db < sql/add_marketing_channel_column.sql
```

### `add_content_validation_columns.sql`
**Purpose:** Add content validation status tracking

Adds columns to track prohibited words validation results.

**Adds:**
- `content_validation_status` - Validation status (passed, skipped, not_validated)
- `content_validation_message` - Validation message with details

**Usage:**
```bash
mysql -u root -p campaigns_db < sql/add_content_validation_columns.sql
```

### `add_brand_validation_columns.sql`
**Purpose:** Add brand color validation tracking

Adds dedicated columns for brand color compliance validation results.

**Adds:**
- `brand_validation_status` - Validation status (passed, warning, error, skipped, not_validated)
- `brand_validation_message` - Human-readable validation message
- `brand_validation_result` - Complete validation details (JSON)
- Indexes for fast querying

**Usage:**
```bash
mysql -u root -p campaigns_db < sql/add_brand_validation_columns.sql
```

## Running Migrations

### Initial Setup (New Installation)

```bash
# 1. Create database and user
mysql -u root -p < sql/setup_mysql.sql

# 2. Application will create tables automatically via SQLAlchemy
python -c "from api.database import init_db; init_db()"

# 3. Run all migrations in order (if needed)
mysql -u root -p campaigns_db < sql/add_dropbox_columns.sql
mysql -u root -p campaigns_db < sql/add_auto_upload_dropbox_column.sql
mysql -u root -p campaigns_db < sql/add_marketing_channel_column.sql
mysql -u root -p campaigns_db < sql/add_content_validation_columns.sql
mysql -u root -p campaigns_db < sql/add_brand_validation_columns.sql
```

### Existing Installation (Add New Feature)

Run only the migration for the feature you want to add:

```bash
# Example: Add brand validation
mysql -u root -p campaigns_db < sql/add_brand_validation_columns.sql
```

## Verifying Migrations

After running a migration, verify it succeeded:

```sql
-- Connect to database
mysql -u root -p campaigns_db

-- Show table structure
DESCRIBE campaigns;

-- Check for specific columns
SHOW COLUMNS FROM campaigns LIKE 'brand_validation%';

-- Check indexes
SHOW INDEX FROM campaigns;
```

## Rollback

Most migrations include comments about rollback procedures. Generally:

```sql
-- Example: Remove a column
ALTER TABLE campaigns DROP COLUMN column_name;

-- Example: Remove an index
DROP INDEX index_name ON campaigns;
```

**Warning:** Dropping columns is destructive and will lose data. Always backup before rollback.

## Migration History

| Date | Script | Feature | Status |
|------|--------|---------|--------|
| - | `setup_mysql.sql` | Initial setup | ✅ Required |
| - | `add_dropbox_columns.sql` | Dropbox integration | ✅ Optional |
| - | `add_auto_upload_dropbox_column.sql` | Auto-upload flag | ✅ Optional |
| - | `add_marketing_channel_column.sql` | Marketing channels | ✅ Optional |
| - | `add_content_validation_columns.sql` | Content validation | ✅ Optional |
| 2025-10-15 | `add_brand_validation_columns.sql` | Brand validation | ✅ Optional |

## Best Practices

1. **Backup First:** Always backup your database before running migrations
   ```bash
   mysqldump -u root -p campaigns_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on Staging:** Run migrations on a staging environment first

3. **Read the Script:** Review the SQL file before running it

4. **Check Dependencies:** Some migrations may depend on others

5. **Monitor Performance:** After adding indexes, monitor query performance

## Troubleshooting

### Error: "Table doesn't exist"

**Cause:** Database tables not created yet

**Solution:**
```bash
python -c "from api.database import init_db; init_db()"
```

### Error: "Column already exists"

**Cause:** Migration already run

**Solution:** This is safe to ignore, or check the table structure to confirm.

### Error: "Access denied"

**Cause:** Insufficient database permissions

**Solution:**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON campaigns_db.* TO 'campaign_user'@'localhost';
FLUSH PRIVILEGES;
```

## Related Documentation

- [README.md](../README.md) - Main project documentation
- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - General migration guidance
- [BRAND_VALIDATION_COLUMN_MIGRATION_GUIDE.md](../BRAND_VALIDATION_COLUMN_MIGRATION_GUIDE.md) - Brand validation specific guide
- [CONTENT_VALIDATION.md](../CONTENT_VALIDATION.md) - Content validation feature docs
- [DROPBOX_QUICK_START.md](../DROPBOX_QUICK_START.md) - Dropbox integration guide

## Support

For issues or questions about migrations:
1. Check the specific feature documentation
2. Review the SQL file comments
3. Verify table structure with `DESCRIBE campaigns`
4. Check MySQL error logs

