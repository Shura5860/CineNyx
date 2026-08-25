import Kind from "../models/kinds.js";
import slugify from "slugify";

export const getKinds = async (req, res) => {
  try {
    const kinds = await Kind.find().sort({ name: 1 });
    res.status(200).json(kinds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getKindBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const kind = await Kind.findOne({ slug });
    if (!kind) {
      return res.status(404).json({ message: "Kind not found" });
    }

    res.status(200).json(kind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createKind = async (req, res) => {
  try {
    const { name } = req.body;

    const kind = await Kind.create({
      name,
      slug: slugify(name, { lower: true })
    });

    res.status(201).json(kind);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Bu kind zaten mevcut"
      });
    }

    res.status(500).json({ message: error.message });
  }
};

export const updateKind = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name } = req.body;

    const updateData = {};

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true });
    }

    const kind = await Kind.findOneAndUpdate(
      { slug },
      updateData,
      { new: true, runValidators: true }
    );

    if (!kind) {
      return res.status(404).json({ message: "Kind not found" });
    }

    res.status(200).json(kind);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteKind = async (req, res) => {
  try {
    const { slug } = req.params;

    const kind = await Kind.findOneAndDelete({ slug });
    if (!kind) {
      return res.status(404).json({ message: "Kind not found" });
    }

    res.status(200).json({ message: "Kind deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
