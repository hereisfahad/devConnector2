import express from "express";
import { body, validationResult } from 'express-validator';

import Post from "../../models/Post.js";
import auth from "../../middleware/auth.js";
import User from "../../models/User.js";

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
        res.json(posts)
    } catch (error) {
        res.status(404).json({ nopostsfound: 'No posts found' })
    }
});

router.get('/:postId', auth, async (req, res) => {
    try {
        const profile = await Post.findById(req.params.postId)
        if (!profile) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(profile);
    } catch (error) {
        if (error.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error')
    }
});

router.post(
    '/',
    auth,
    body('text', 'Text is required').not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.id

        try {
            const user = await User.findById(userId).select('-password')
            const newPost = await Post.create({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: userId
            });
            res.json(newPost)
        } catch (error) {
            res.status(500).send('Server Error')
        }
    }
);

router.put(
    '/like/:postId',
    auth,
    async (req, res) => {
        const userId = req.user.id
        const { postId } = req.params
        try {
            let post = await Post.findById(postId)
            if (post.likes.filter(like => like.user.toString() === userId).length > 0) {
                await Post.updateOne(
                    { _id: postId },
                    { $pull: { likes: { user: userId } } },
                )
                return res.json(await Post.findById(postId))
            }
            post.likes.unshift({ user: userId });
            await post.save();
            res.json(post)
        } catch (error) {
            res.status(404).json({ postnotfound: 'No post found' })
        }
    }
);

router.post(
    '/comment/:postId',
    auth,
    body('text', 'Text is required').not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.id

        try {
            const user = await User.findById(userId).select('-password')
            let post = await Post.findById(req.params.postId)
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: userId
            };
            post.comments.unshift(newComment);
            await post.save()
            res.json(post)
        } catch (error) {
            res.status(500).send('Server Error')
        }
    }
);

router.delete(
    '/:postId',
    auth,
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.postId)
            if (!post) return res.status(404).json({ msg: 'Post not found' })
            if (post.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' })
            await post.remove()
            res.json({ success: true, msg: 'Post removed' })
        } catch (error) {
            if (error.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
            res.status(500).send('Server Error')
        }
    }
);

router.delete(
    '/:postId/comment/:commentId',
    auth,
    async (req, res) => {
        try {
            const { postId, commentId } = req.params
            let post = await Post.findById(postId)
            const comment = post.comments.find(comment => comment.id === commentId)
            if (!comment) {
                return res.status(404).json({ msg: 'Comment not found' })
            }

            if (comment.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not authorized' })
            }

            await Post.updateOne(
                { _id: postId },
                { $pull: { comments: { _id: commentId } } },
            )
            return res.json(await Post.findById(postId))
        } catch (error) {
            console.log(error)
            if (error.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
            res.status(500).send('Server Error')
        }
    }
);

export default router;
