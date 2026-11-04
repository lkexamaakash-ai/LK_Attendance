const jwt = require("jsonwebtoken");

// Builds an auth middleware. A user whose token says mustChangePassword
// (first login with the default password) is blocked everywhere except on
// routes that explicitly opt in with `allowPasswordPending`.
const buildProtect = (allowPasswordPending) => (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.mustChangePassword && !allowPasswordPending) {
      return res.status(403).json({
        success: false,
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your default password before continuing",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const protect = buildProtect(false);
const protectAllowPasswordPending = buildProtect(true);

module.exports = {
  protect,
  protectAllowPasswordPending,
};
