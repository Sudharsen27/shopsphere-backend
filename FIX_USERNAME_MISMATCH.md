# Fix MongoDB Username Mismatch

## 🔍 Problem Found

Your connection string uses: `shopsphere_user`  
But MongoDB Atlas has user: `ShopSphere`

**This is why authentication is failing!**

## ✅ Solution: Update Render Environment Variable

### Step 1: Get the Password for `ShopSphere` User

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **Database Access** (left sidebar)
3. Find user **"ShopSphere"** in the list
4. Click **Edit** button next to it
5. Click **"Edit Password"** button
6. **Option A:** If you know the password, note it down
7. **Option B:** If you don't know it, reset it:
   - Click **"Edit Password"**
   - Enter a new password (e.g., `ShopSphere123`)
   - Click **Update User**
   - **Save this password!**

### Step 2: Update Render Environment Variable

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **shopsphere-backend** service
3. Go to **Environment** tab
4. Find `MONGO_URI` variable
5. Click **Edit** (pencil icon)
6. **Replace the entire value** with:

```
mongodb+srv://ShopSphere:YOUR_PASSWORD@cluster0.tdmehqg.mongodb.net/shopsphere?retryWrites=true&w=majority
```

**Replace `YOUR_PASSWORD`** with the actual password for `ShopSphere` user.

**Example:**
- If password is `ShopSphere123`, use:
```
mongodb+srv://ShopSphere:ShopSphere123@cluster0.tdmehqg.mongodb.net/shopsphere?retryWrites=true&w=majority
```

7. Click **Save Changes**

### Step 3: Verify Network Access

1. In MongoDB Atlas, go to **Network Access** (left sidebar)
2. Check if there's an entry allowing `0.0.0.0/0` (all IPs)
3. If not, click **Add IP Address**
4. Enter `0.0.0.0/0`
5. Click **Confirm**

### Step 4: Wait for Auto-Deploy

Render will automatically redeploy after you save the environment variable. Check the logs - you should see:

```
✅ MongoDB Connected: cluster0.tdmehqg.mongodb.net
📊 Database: shopsphere
```

## 🔄 Alternative: Create New User Matching Connection String

If you prefer to keep the connection string as-is, create a new user:

1. MongoDB Atlas → **Database Access**
2. Click **"+ ADD NEW DATABASE USER"**
3. Authentication Method: **Password**
4. Username: `shopsphere_user` (matches your connection string)
5. Password: `shopsphere123` (matches your connection string)
6. Database User Privileges: **Read and write to any database**
7. Click **Add User**
8. Keep Render's `MONGO_URI` as-is (no changes needed)

## 📋 Quick Checklist

- [ ] Found password for `ShopSphere` user in MongoDB Atlas
- [ ] Updated `MONGO_URI` in Render with correct username `ShopSphere`
- [ ] Replaced `YOUR_PASSWORD` with actual password
- [ ] Verified Network Access allows `0.0.0.0/0`
- [ ] Render auto-deployed successfully
- [ ] Logs show "✅ MongoDB Connected"

## 🎯 Expected Result

After updating, Render logs should show:
```
🔌 Attempting to connect to MongoDB: cluster0.tdmehqg.mongodb.net...
✅ MongoDB Connected: cluster0.tdmehqg.mongodb.net
📊 Database: shopsphere
✅ Server running on port 10000
```

No more "Authentication failed" errors! 🎉
