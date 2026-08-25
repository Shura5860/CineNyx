import fetch from "node-fetch";
import Country from "../models/country.js";
import { countryTrMap } from "../helpers/countryTranslateMap.js";

export const syncCountries = async () => {
    const url = "https://api.themoviedb.org/3/configuration/countries";

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
            accept: "application/json"
        }
    });

    const data = await res.json();

    for (const country of data) {
        await Country.findOneAndUpdate(
            { tmdbCode: country.iso_3166_1 },
            {
                tmdbCode: country.iso_3166_1,
                name: countryTrMap[country.iso_3166_1] || country.english_name || native_name,
            },
            { upsert: true }
        );
    }

    console.log("🌍 Countries sync tamam");
};
