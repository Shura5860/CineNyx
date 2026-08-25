export const uploadSingle = (req, res) => {
  res.status(201).json({
    url: req.file.location,
    key: req.file.key
  });
};
