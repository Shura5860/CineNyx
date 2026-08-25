import fetch from "node-fetch";
import Kind from "../models/kinds.js";

export const syncGenres = async () => {
  const url = "https://api.themoviedb.org/3/genre/movie/list?language=tr-TR";

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      accept: "application/json"
    }
  });

  const data = await res.json();

  for (const genre of data.genres) {
    await Kind.findOneAndUpdate(
      { tmdbId: genre.id },
      {
        name: genre.name,
        tmdbId: genre.id
      },
      { upsert: true, new: true }
    );
  }

  console.log("🔥 Genres sync tamam");
};
