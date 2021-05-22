import express from "express";
import auth from "../../middleware/auth.js";
import User from "../../models/User.js";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from 'cookie';

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    res.json(user);
  } catch (err) {
    res.status(500).json("server error");
  }
});

router.post(
  "/",
  body("email", "Enter valid email address").isEmail(),
  body("password", "Password is required").exists()
  ,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      //check if user already exists in database
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }
      //compare the password with hashed
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }
      //payload with user id
      const payload = {
        user: {
          id: user.id
        }
      };
      //implement jsonwebtoken
      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: '1d' },
        (error, token) => {
          if (error) throw error;
          res.setHeader('Set-Cookie',
            cookie.serialize('token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV !== "development",
              maxAge: 60 * 60 * 24, // 1 day
              sameSite: "none",
              path: "/"
            }))
          return res.json({ sucess: true });
        }
      );
    } catch (error) {
      res.status(500).json("server error");
    }
  }
);

router.post(
  "/logout",
  async (_, res) => {
    try {
      res.setHeader('Set-Cookie',
        cookie.serialize('token', "", {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          expires: new Date(0),
          sameSite: "strict",
          path: "/"
        }))
      return res.json({ sucess: true });
    } catch (error) {
      res.status(500).json("server error");
    }
  }
);

export default router;
