# MongoDB Authentication Troubleshooting

## Your Current Connection String
```
mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?authSource=admin
```

## Step-by-Step Fix

### 1. Verify Database User Exists in MongoDB Atlas

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Select your cluster: `cluster0.tdmehqg.mongodb.net`
3. Click **Database Access** in the left sidebar
4. Look for user: `shopsphere_user`
5. If the user doesn't exist:
   - Click **Add New Database User**
   - Authentication Method: **Password**
   - Username: `shopsphere_user`
   - Password: `shopsphere123` (or create a new password)
   - Database User Privileges: **Read and write to any database** (or **Atlas admin**)
   - Click **Add User**

### 2. Check User Authentication Database

The `authSource=admin` in your connection string means MongoDB will authenticate the user against the `admin` database. 

**Important:** The user must exist in the `admin` database for this to work.

**Option A: User is in admin database (keep authSource=admin)**
- Your connection string is correct as-is
- Make sure the user `shopsphere_user` was created with admin database selected

**Option B: User is NOT in admin database (remove authSource)**
- Try removing `?authSource=admin` from your connection string:
  ```
  mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere
  ```
- Or use the default authSource by not specifying it

### 3. Verify Network Access

1. Go to **Network Access** in MongoDB Atlas
2. Check if there's an entry allowing connections
3. If not, click **Add IP Address**
4. Add `0.0.0.0/0` (allows all IPs) or Render's specific IPs
5. Click **Confirm**

### 4. Verify User Permissions

1. Go to **Database Access**
2. Click on `shopsphere_user`
3. Verify the user has:
   - **Read and write to any database** OR
   - **Atlas admin** role
4. If permissions are wrong, click **Edit** and update them

### 5. Test Connection String Variations

Try these connection string variations in Render's environment variables:

#### Option 1: Without authSource (if user is not in admin DB)
```
MONGO_URI=mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?retryWrites=true&w=majority
```

#### Option 2: With authSource=admin (current)
```
MONGO_URI=mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?authSource=admin&retryWrites=true&w=majority
```

#### Option 3: Full connection string with all options
```
MONGO_URI=mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?authSource=admin&retryWrites=true&w=majority&ssl=true
```

### 6. Create a New User (If Current One Doesn't Work)

If the existing user has issues, create a fresh one:

1. Go to **Database Access** → **Add New Database User**
2. Username: `shopsphere_app` (or any name)
3. Password: Generate a strong password (or use a simple one like `ShopSphere2024!`)
4. **Important:** If password has special characters, URL-encode them:
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`
   - etc.
5. Database User Privileges: **Read and write to any database**
6. Authentication Database: Leave as default (usually `admin`)
7. Click **Add User**
8. Update your connection string in Render with the new credentials

### 7. Test Locally First

Before deploying to Render, test the connection locally:

1. Create/update `.env` file:
   ```env
   MONGO_URI=mongodb+srv://shopsphere_user:shopsphere123@cluster0.tdmehqg.mongodb.net/shopsphere?authSource=admin
   ```

2. Run test script:
   ```bash
   cd shopsphere-backend
   node test-mongo-connection.js
   ```

3. If it works locally but not on Render:
   - Check Render environment variables are set correctly
   - Verify no extra spaces or quotes in Render's MONGO_URI
   - Check Render logs for the exact connection string being used

## Common Issues & Solutions

### Issue: "bad auth : Authentication failed"

**Possible Causes:**
1. ❌ User doesn't exist in MongoDB Atlas
2. ❌ Password is incorrect
3. ❌ User exists but in wrong authentication database
4. ❌ User doesn't have proper permissions

**Solutions:**
- Verify user exists in Database Access
- Try creating a new user with fresh credentials
- Try removing `authSource=admin` from connection string
- Verify user has "Read and write" permissions

### Issue: Connection works locally but not on Render

**Possible Causes:**
1. ❌ Environment variable not set in Render
2. ❌ Extra spaces/quotes in Render's environment variable
3. ❌ Network access not allowing Render's IPs

**Solutions:**
- Double-check MONGO_URI in Render dashboard (no quotes, no spaces)
- Add `0.0.0.0/0` to Network Access in MongoDB Atlas
- Check Render logs to see what connection string is being used

### Issue: "ENOTFOUND" or connection timeout

**Possible Causes:**
1. ❌ Network Access not configured
2. ❌ Cluster is paused
3. ❌ Wrong cluster hostname

**Solutions:**
- Add `0.0.0.0/0` to Network Access
- Verify cluster is running (not paused)
- Double-check cluster hostname in connection string

## Quick Checklist

Before deploying to Render, verify:
- [ ] User `shopsphere_user` exists in MongoDB Atlas Database Access
- [ ] Password `shopsphere123` is correct (or matches what's in Atlas)
- [ ] User has "Read and write to any database" permissions
- [ ] Network Access allows `0.0.0.0/0` (all IPs)
- [ ] Connection string tested locally and works
- [ ] `MONGO_URI` set correctly in Render (no quotes, no spaces)
- [ ] `authSource=admin` matches where user was created (or remove it)

## Recommended Connection String Format

For most cases, use this format (without authSource unless needed):

```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

If your user is specifically in the admin database, add `authSource=admin`:

```
mongodb+srv://username:password@cluster.mongodb.net/database?authSource=admin&retryWrites=true&w=majority
```

## Next Steps

1. ✅ Verify user exists in MongoDB Atlas
2. ✅ Check Network Access settings
3. ✅ Try connection string without `authSource=admin`
4. ✅ Test locally first
5. ✅ Update Render environment variables
6. ✅ Check Render logs after redeploy
