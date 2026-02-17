# Fix MongoDB Authentication Error in Render

## Current Error
```
MongoDB connection failed: bad auth : Authentication failed.
```

This error means your MongoDB credentials in Render are incorrect or not properly configured.

## Step-by-Step Fix

### 1. Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (format):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

### 2. URL-Encode Your Password (CRITICAL!)

**If your password contains special characters, you MUST URL-encode them:**

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `&` | `%26` |
| `=` | `%3D` |
| `+` | `%2B` |
| ` ` (space) | `%20` |

**Example:**
- Original password: `MyP@ss#123`
- URL-encoded: `MyP%40ss%23123`
- Connection string: `mongodb+srv://myuser:MyP%40ss%23123@cluster.mongodb.net/shopsphere?retryWrites=true&w=majority`

**Quick URL-encode tool:** Use JavaScript's `encodeURIComponent()` or online tools like https://www.urlencoder.org/

### 3. Set Environment Variables in Render

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Select your **shopsphere-backend** service
3. Go to **Environment** tab
4. Add/Update these variables:

```
MONGO_URI=mongodb+srv://username:encoded_password@cluster.mongodb.net/shopsphere?retryWrites=true&w=majority
JWT_SECRET=your_strong_jwt_secret_here_minimum_32_characters
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=10000
```

**Important Notes:**
- Replace `username` with your MongoDB Atlas username
- Replace `encoded_password` with your URL-encoded password
- Replace `cluster.mongodb.net` with your actual cluster hostname
- Replace `shopsphere` with your database name (if different)
- Make sure `JWT_SECRET` is a long random string (at least 32 characters)

### 4. Verify MongoDB Atlas Settings

#### A. Network Access
1. Go to **Network Access** in MongoDB Atlas
2. Click **Add IP Address**
3. Add `0.0.0.0/0` to allow all IPs (or Render's specific IPs if you prefer)
4. Click **Confirm**

#### B. Database User
1. Go to **Database Access** in MongoDB Atlas
2. Find your database user
3. Ensure the user has:
   - **Read and write** permissions (or **Atlas admin**)
   - Correct username and password
4. If needed, create a new user:
   - Click **Add New Database User**
   - Choose **Password** authentication
   - Username: (choose a username)
   - Password: (choose a password - remember to URL-encode if it has special chars!)
   - Database User Privileges: **Read and write to any database**
   - Click **Add User**

### 5. Test Your Connection String Locally

Before deploying to Render, test your connection string locally:

1. Create a `.env` file in `shopsphere-backend`:
   ```env
   MONGO_URI=mongodb+srv://username:encoded_password@cluster.mongodb.net/shopsphere?retryWrites=true&w=majority
   JWT_SECRET=test_secret
   ```

2. Run the test script:
   ```bash
   cd shopsphere-backend
   node test-mongo-connection.js
   ```

3. If it connects successfully, you'll see:
   ```
   ✅ Connected to MongoDB!
   📊 Database: shopsphere
   ```

### 6. Redeploy on Render

After updating environment variables:
1. Render will automatically redeploy
2. Check the logs for:
   ```
   ✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
   📊 Database: shopsphere
   ```

## Common Issues & Solutions

### Issue: Still getting "bad auth" error

**Solutions:**
1. ✅ Double-check password encoding (most common issue!)
2. ✅ Verify username doesn't have special characters (or encode them too)
3. ✅ Try creating a new database user with a simple password (no special chars)
4. ✅ Test connection string locally first using `test-mongo-connection.js`
5. ✅ Make sure you're using the correct database user (not the Atlas admin user)

### Issue: Connection timeout

**Solutions:**
1. ✅ Check Network Access settings in MongoDB Atlas
2. ✅ Ensure `0.0.0.0/0` is added to allowed IPs
3. ✅ Verify cluster is running (not paused)
4. ✅ Check if your MongoDB Atlas cluster is in the same region as Render

### Issue: Database not found

**Solutions:**
1. ✅ Verify database name in connection string matches your actual database
2. ✅ MongoDB Atlas creates databases automatically, but ensure the name is correct
3. ✅ The database name is the part after the `/` in the connection string

### Issue: Environment variable not being read

**Solutions:**
1. ✅ Make sure environment variable name is exactly `MONGO_URI` (case-sensitive)
2. ✅ No quotes around the value in Render's environment variables
3. ✅ No spaces before/after the `=` sign
4. ✅ Click **Save Changes** after updating environment variables

## Quick Checklist

Before deploying, verify:
- [ ] MongoDB connection string is correct
- [ ] Password is URL-encoded (if it has special characters)
- [ ] Network Access allows `0.0.0.0/0` or Render's IPs
- [ ] Database user has read/write permissions
- [ ] Connection string tested locally and works
- [ ] Environment variables set in Render dashboard
- [ ] `JWT_SECRET` is set and is at least 32 characters
- [ ] `NODE_ENV=production` is set

## After Fixing

Once MongoDB connects successfully, you should see in Render logs:
```
✅ Server running on port 10000
🌍 Environment: production
🔌 Attempting to connect to MongoDB: cluster0.xxxxx.mongodb.net...
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📊 Database: shopsphere
```

Your API should now be working! 🎉
