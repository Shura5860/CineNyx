import Comment from "../models/comment.js";
import jwt from "jsonwebtoken";

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getComments = async (req, res) => {
  try {
    const { contentId } = req.params;
    const comments = await Comment.find({ contentId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const { contentId, text } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.access_token || 
                  req.body.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Giriş yapmanız gerekiyor' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Yorum boş olamaz' });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({ message: 'Yorum en fazla 1000 karakter olabilir' });
    }
    
    const comment = await Comment.create({
      contentId,
      userId: decoded.id,
      text: text.trim()
    });
    
    const populated = await Comment.findById(comment._id)
      .populate('userId', 'username');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.access_token || 
                  req.query?.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Giriş yapmanız gerekiyor' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }
    
    // Sadece yorum sahibi veya admin silebilir
    if (comment.userId.toString() !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok' });
    }
    
    await Comment.findByIdAndDelete(id);
    res.status(200).json({ message: 'Yorum silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
