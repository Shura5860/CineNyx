import User from "../models/user.js";
import { getPresignedUrl } from "../helpers/presignedUrl.js";

/**
 * Tüm kullanıcıları listele (admin paneli için).
 * Query params: ?role=admin|user|moderator  &search=...  &page=1  &limit=24
 */
export const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { username: regex },
        { email: regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpire")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    // profileImage presigned URL'ye çevir
    const signedUsers = users.map(u => ({
      ...u,
      profileImage: u.profileImage && u.profileImage !== "default_profile.png"
        ? getPresignedUrl(u.profileImage)
        : null
    }));

    res.status(200).json({ data: signedUsers, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Kullanıcı detayı
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .lean();

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    user.profileImage = user.profileImage && user.profileImage !== "default_profile.png"
      ? getPresignedUrl(user.profileImage)
      : null;

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Kullanıcı rolünü güncelle
 * Body: { role: 'admin' | 'user' | 'moderator' }
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user", "moderator"].includes(role)) {
      return res.status(400).json({ message: "Geçersiz rol" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire");

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Kullanıcı bilgilerini güncelle (admin paneli)
 * Body: { username?, email?, role?, blocked? }
 */
export const updateUser = async (req, res) => {
  try {
    const { username, email, role, blocked } = req.body;
    const updates = {};

    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) {
      if (!["admin", "user", "moderator"].includes(role)) {
        return res.status(400).json({ message: "Geçersiz rol" });
      }
      updates.role = role;
    }
    if (blocked !== undefined) updates.blocked = !!blocked;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Güncellenecek alan bulunamadı" });
    }

    // username veya email uniqueness kontrolü
    if (updates.username) {
      const existing = await User.findOne({ username: updates.username, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }
    if (updates.email) {
      const existing = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ message: "Bu e-posta zaten kullanılıyor" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire");

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Kullanıcıyı engelle / engeli kaldır (toggle)
 */
export const toggleUserBlock = async (req, res) => {
  try {
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    existing.blocked = !existing.blocked;
    await existing.save();

    const user = existing.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;

    res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Kullanıcıyı sil
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    res.status(200).json({ message: "Kullanıcı silindi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Dashboard istatistikleri
 */
export const getUserStats = async (req, res) => {
  try {
    const [total, admins, users, moderators, blocked] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "moderator" }),
      User.countDocuments({ blocked: true })
    ]);

    res.status(200).json({ total, admins, users, moderators, blocked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
