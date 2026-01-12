export const getUserProfile = async (req, res) => {
  res.json({
    message: "Profile fetched successfully",
    user: req.user
  });
};
    