import express from "express";
import gravatar from "gravatar";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from 'express-validator';

import User from "../../models/User.js";

const router = express.Router();

router.post(
  "/",
  body('name', "Name is required").not().isEmpty().trim().escape(),
  body('email', "Enter valid email address").isEmail().normalizeEmail(),
  body('password', "Password must be of 6 or more characters").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, password } = req.body;
    try {
      //check if user already exists in database
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "user already exists" }] });
      }
      //set avatar
      const avatar = gravatar.url(email, { s: "200", d: "mm", r: "pg" });
      //create new user using user model
      user = new User({
        name,
        email,
        avatar,
        password
      });
      //encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      //save in database
      await user.save();
      //res.send(user);

      const payload = {
        user: {
          id: user.id
        }
      };
      //implement jsonwebtoken
      jwt.sign(
        payload,
        process.env.jwtSecret,
        { expiresIn: 36000 },
        (error, token) => {
          if (error) throw error;
          //send back jsonwebtoken
          res.json({ token });
        }
      );
    } catch (error) {
      res.status(500).json("server error");
    }
  }
);

export default router;
