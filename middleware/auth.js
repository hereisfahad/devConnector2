import jwt from "jsonwebtoken";

export default function(req, res, next) {
  const token = req.header("token");

  if (!token) res.status(401).json("no token, authorization failed");
  
  try {
    //verify token and get the payload
    const decoded = jwt.verify(token, process.env.jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json("token is not valid");
  }
};
