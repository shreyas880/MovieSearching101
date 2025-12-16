MovieSearching101: Your personal movie discovery hub.

What does my project do?
This project is a completely client-side application using OMDb API as well as OpenAI API to help users find movies to watch as well as save them in a Watch Later list.

Demo/Screenshots of the working present in the folder "DemoScreenshots"

FEATURES:
Load Trending Movies via OpenAI API on loading.
Search Movies, by title via OMDb API.
Functional search History via localStorage.
Dark/Light Mode toggle.
Add/Remove Movies to Watch Later
Responsive UI with no hard coding, flexible to various screen sizes.

TECHNOLOGIES USED:
HTML, CSS, JS (No react-native used in any form whatsoever).
OpenAI API (generate key here: https://www.omdbapi.com/apikey.aspx), replace OMDB_API_KEY with your key
OMDb API (generate key here: https://platform.openai.com/api-keys), replace OPENAI_API_KEY with your key

USAGE:
Search for a movie using the search bar
Click on a movie card to view details
Add or remove movies from Watch Later
View saved movies on the Watch Later page
Toggle between Light/Dark mode.

Project Structure:
1. index.html, App.js, styles.css - Constitute the home page and search functionality of the project.
2. MovieCard.html, MovieCard.js, MovieCard.css - Display the movie card and movie details along with recommendations.
3. WatchLater.html, WatchLater.js, WatchLater.css - Load the list of movies in WatchLater as well as optimising watch list for limited time movie marathons. Optimising logic can be switched based on user preference.
4. assets/ - Contains the assets such as sidebar.png etc. used for commonly seen features.

State Management:
localStorage.searchHistory – stores recent search terms
localStorage.watchLater – stores saved movie IDs
localStorage.movieID – currently selected movie

Error Handling:
Display toast notifications if recommendations fail
Fallback posters for missing images
Prevent duplicate entries in Watch Later

Limitations/Issues:
1. Current prompt for LLM API can throw errors quite frequently, due to which loading trending movies becomes an issue.
2. No protection against the use of the API key, which shows a security issue.
3. OMDb API has rate limits (although not much of an issue for a small-scale project like this)
4. Could Not add Mood-Based Searching as the LLM wasn't reliably giving a response that could be used
5. Could Not add Actors/Actress based searching as it wasn't supported by the API


Potential Improvements:
User authentication
Back-end Database.
Feature allowing users to rate/review movies.

