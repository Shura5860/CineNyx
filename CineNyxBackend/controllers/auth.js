import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { sendJwtToClient } from "../helpers/tokenHelper.js";

export const register = async (req, res) => {
    if (process.env.NODE_ENV === "development") {
        console.log("Gelen Veri: ", req.body);
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Tüm Alanları Doldurun" });
    }

    try {
        const newUser = new User({ username, email, password });
        await newUser.save();

        sendJwtToClient(newUser, res);
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.log("Kayıt Hatası: ", error);
        }

        res.status(500).json({ message: "Kayıt Sırasında Bir Hata Oluştu" });
    }
};

export const login = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Tüm Alanları Doldurun" });
    }

    try {
        
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim());
        const filter = isEmail ? { email: username.trim() } : { username: username.trim() };
        const user = await User.findOne(filter).select("+password");

        if (!user) {
            return res.status(400).json({ message: "Kullanıcı Bulunamadı" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Şifre Yanlış" });
        }

        sendJwtToClient(user, res);
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.log("Giriş Hatası: ", error);
        }

        res.status(500).json({ message: "Giriş Sırasında Bir Hata Oluştu" });
    }
}

export const logout = async (req, res) => {
    res.clearCookie("access_token");
    res.status(200).json({
        success: true,
        message: "Çıkış Başarılı"
    });
};