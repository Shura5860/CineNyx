import SubtitleOption from "../models/subtitleOption.js";
import Content from "../models/content.js";
import { getPresignedUrl } from "../helpers/presignedUrl.js";

export const getSubtitleOptionsByFilm = async (req, res) => {
  try {
    const { filmId } = req.params;

    const subtitles = await SubtitleOption.find({ filmId });
    const signedSubtitles = subtitles.map(s => {
      const obj = s.toObject();
      obj.path = getPresignedUrl(obj.path);
      return obj;
    });
    res.status(200).json(signedSubtitles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSubtitleOption = async (req, res) => {
  try {
    const { filmId, language } = req.body;

    const subtitleOption = await SubtitleOption.create({
      filmId,
      language
    });

    // Content'in subtitleOptions dizisine ekle
    await Content.findByIdAndUpdate(filmId, {
      $addToSet: { subtitleOptions: subtitleOption._id }
    });

    res.status(201).json({
      step: "create",
      completed: false,
      subtitleOption
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadSubtitleFile = async (req, res) => {
  try {
    const { id } = req.params;

    const subtitleOption = await SubtitleOption.findById(id);
    if (!subtitleOption) {
      return res.status(404).json({ message: "Subtitle option not found" });
    }

    subtitleOption.path = req.file.location;
    await subtitleOption.save();

    res.status(200).json({
      step: "subtitle-upload",
      completed: true,
      subtitleOption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSubtitleOption = async (req, res) => {
  try {
    const { id } = req.params;

    const subtitleOption = await SubtitleOption.findByIdAndDelete(id);
    if (!subtitleOption) {
      return res.status(404).json({ message: "Subtitle option not found" });
    }

    // Content'in subtitleOptions dizisinden referansı kaldır
    await Content.findByIdAndUpdate(subtitleOption.filmId, {
      $pull: { subtitleOptions: subtitleOption._id }
    });

    res.status(200).json({ message: "Subtitle option deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
