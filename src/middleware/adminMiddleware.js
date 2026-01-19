// const adminOnly = (req, res, next) => {
//   if (req.user && req.user.role === "admin") {
//     next();
//   } else {
//     res.status(403).json({ message: "Admin access required" });
//   }
// };

// export default adminOnly;

// const adminOnly = (req, res, next) => {
//   if (req.user && req.user.role === "admin") {
//     next();
//   } else {
//     res.status(403).json({ message: "Admin access required" });
//   }
// };

// export default adminOnly;


// const adminOnly = (req, res, next) => {
//   if (req.user && req.user.role === "admin") {
//     next();
//   } else {
//     res.status(403).json({ message: "Admin access required" });
//   }
// };

// export default adminOnly;


const adminOnly = (req, res, next) => {
  console.log("ADMIN CHECK ROLE:", req.user?.role); // 👈 ADD THIS LOG

  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

export default adminOnly;
