import Country from "../models/country.js";
import slugify from "slugify";

export const getAllCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });
    res.status(200).json(countries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCountryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const country = await Country.findOne({ slug });
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.status(200).json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCountry = async (req, res) => {
  try {
    const { name } = req.body;

    const country = await Country.create({
      name,
      slug: slugify(name, { lower: true })
    });

    res.status(201).json({
      step: "create",
      completed: false,
      country
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Bu ülke zaten mevcut"
      });
    }

    res.status(500).json({ message: error.message });
  }
};

export const updateCountry = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name } = req.body;

    const updateData = {};

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true });
    }

    const country = await Country.findOneAndUpdate(
      { slug },
      updateData,
      { new: true, runValidators: true }
    );

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.status(200).json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCountry = async (req, res) => {
  try {
    const { slug } = req.params;

    const country = await Country.findOneAndDelete({ slug });
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.status(200).json({ message: "Country deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadCountryIcon = async (req, res) => {
  try {
    const { id } = req.params;

    const country = await Country.findById(id);
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    country.icon = req.file.location;
    country.isCompleted = true;
    await country.save();

    res.status(200).json({
      step: "icon-upload",
      completed: true,
      country
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
