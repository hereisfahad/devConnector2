import express from "express";
import axios from 'axios';
import { body, validationResult } from 'express-validator';

import auth from "../../middleware/auth.js";
import Profile from "../../models/Profle.js";
import User from "../../models/User.js";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })?.populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res.status(404).json({ msg: "No profile for this user" });
    }
    return res.json(profile);
  } catch (error) {
    res.status(500).json("server error");
  }
});

router.get('/all', async (_, res) => {
  try {
    const profiles = await Profile.find().select("-__v").populate('user', ['name', 'avatar'])
    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ profile: 'There are no profiles' })
    }
    res.json(profiles);
  } catch (error) {
    res.status(404).json({ profile: 'There are no profiles' })
  }
});

router.post(
  '/',
  auth,
  body('handle', 'Handle is required').not().isEmpty(),
  body('status', 'Status is required').not().isEmpty(),
  body('skills', 'Skills is required').not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { body, user } = req
    body.user = user.id

    // Skills - Spilt into array
    if (typeof body.skills !== 'undefined') {
      body.skills = body.skills.split(',');
    }

    try {
      let profile = await Profile.findOne({ user: user.id })
      if (profile) {
        let profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: body },
          { new: true }
        )
        return res.json(profile)
      } else {
        // Create
        // Check if handle exists
        profile = await Profile.findOne({ handle: body.handle })
        if (profile) {
          errors.handle = 'That handle already exists';
          return res.status(400).json(errors);
        } else {
          // Save Profile
          profile = new Profile(body)
          await profile.save()
          return res.json(profile)
        }
      }
    } catch (error) {
      console.log(error)
      res.status(500).send('Server Error')
    }
  }
);

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).select('-__v').populate('user', ['name', 'avatar'])
    if (!profile) {
      return res.status(404).json({ msg: 'There is no profile for this user' });
    }
    return res.json(profile);
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(404).json({ msg: 'There is no profile for this user' });
    res.status(500).send('Server Error')
  }
});

router.post(
  '/experience',
  auth,
  body('title', "Title is required").not().isEmpty(),
  body('company', "Company is required").not().isEmpty(),
  body('from', "From date is required").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profile = await Profile.findOne({ user: req.user.id })
    // Add to exp array
    profile.experience.unshift(req.body);

    await profile.save()
    res.json(profile)
  }
);

router.post(
  '/education',
  auth,
  body('school', "School is required").not().isEmpty(),
  body('degree', "Degree is required").not().isEmpty(),
  body('fieldofstudy', "Field is required").not().isEmpty(),
  body('from', "From date is required").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const profile = await Profile.findOne({ user: req.user.id })
    // Add to exp array
    profile.education.unshift(req.body);

    await profile.save()
    res.json(profile)
  }
);

router.get(
  '/experience/:exp_id',
  auth,
  async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id }).select('experience')
      const experience = profile.experience.filter(exp => exp._id.toString() === req.params.exp_id)[0] || false
      return res.json({ success: true, experience })
    } catch (error) {
      res.status(500).send('Server Error')
    }
  }
);

router.get(
  '/education/:edu_id',
  auth,
  async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id }).select('education')
      const education = profile.education.filter(edu => edu._id.toString() === req.params.edu_id)[0] || false
      return res.json({ success: true, education })
    } catch (error) {
      res.status(500).send('Server Error')
    }
  }
);

router.get('/github/:username', async (req, res) => {
  const limit = req.query.limit || 5
  const { username } = req.params
  try {
    const { data } = await axios.get(`https://api.github.com/users/${username}/repos?per_page=${limit}&sort=created:asc&client_id=${process.env.githubClientId}`)
    res.json({ repos: data })
  } catch (error) {
    res.status(500).send('Server Error')
  }
})

router.delete(
  '/',
  auth,
  async (req, res) => {
    const userId = req.user.id
    try {
      await Profile.findOneAndRemove({ user: userId })
      await User.findOneAndRemove({ _id: userId })
      res.json({ success: true, msg: 'User removed' })
    } catch (error) {
      res.status(500).send('Server Error')
    }
  }
);

router.delete(
  '/experience/:exp_id',
  auth,
  async (req, res) => {
    try {
      await Profile.updateOne({ user: req.user.id }, { $pull: { experience: { _id: req.params.exp_id } } })
      res.json({ success: true })
    } catch (error) {
      res.status(500).send('Server Error')
    }
  }
);

router.delete(
  '/education/:edu_id',
  auth,
  async (req, res) => {
    try {
      await Profile.updateOne({ user: req.user.id }, { $pull: { education: { _id: req.params.edu_id } } })
      res.json({ success: true })
    } catch (error) {
      res.status(500).send('Server Error')
    }
  }
);

export default router;
