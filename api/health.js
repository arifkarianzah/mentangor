module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portal Desa Mentangor API running on Vercel Serverless!",
    timestamp: new Date().toISOString()
  });
};
