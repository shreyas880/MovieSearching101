// All constants declaration including API keys

const textarea = document.getElementById("search"); // To get value of search input

const closeNavigation = document.getElementsByClassName("closebtn"); // Closing of sidebar
const openNavigation = document.getElementsByClassName("sidebar_button"); // Sidebar opening

const searchButton = document.getElementById("searchButton"); // Searching the title without actually clicking enter

const OMDB_API_KEY = "Your OMDB Key Here";
const OPENAI_API_KEY = "Your OpenAI Key Here";

const trendingSection = document.getElementById("trending");
let toastContainer = document.querySelector(".toast-container");

const themeButton = document.getElementById("themeBtn");


// Fallback array of movies (by title) in the case of any errors in loading
const FALLBACK_TRENDING = [
  "Dragon Ball Super: Broly",
  "Avengers: Endgame",
  "The Shawshank Redemption",
  "The Godfather",
  "Oppenheimer",
  "Barbie",
  "Dune",
  "John Wick",
  "Inception",
  "Interstellar",
];

// Only Setting Search History if it doesn't exist from before
if (!localStorage.getItem("searchHistory")) {
  localStorage.setItem("searchHistory", JSON.stringify([]));
}

// Create Toast Container if it doesn't exist
if (!toastContainer) {
  toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);
}

var isSearching = "false";

// Loads the saved theme into the css file
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

window.onload = () => {
  // Changing text content on theme button based on selected theme (Didn't want to do by image)
  const btn = document.getElementById("themeBtn");
  if (btn) {
    if (savedTheme === "dark") {
      btn.textContent = "☀️";
    } else {
      btn.textContent = "🌙";
    }
  }

  loadTrendingMovies();
};

// Search Input Event Listener
textarea.addEventListener("keydown", (keyEvent) => {
  if (
    keyEvent.code === "Enter" &&
    !keyEvent.shiftKey &&
    isSearching === "false"
  ) {
    keyEvent.preventDefault(); // Prevents from going to the next line

    if (!textarea.value.trim()) {
      showToast("Please Enter a Title!");
      return;
    }

    // Loading image being added in its container
    let load = document.createElement("div");
    load.className = "loading";

    let load_img = document.createElement("img");
    load_img.className = "loading-image";
    load_img.src = "assets/search.gif";

    load.appendChild(load_img);
    document.getElementById("loading").appendChild(load);

    trendingSection.style.display = "none";

    // Fetching Movies
    fetchMovie();
  }
});

// Search History suggestions
const suggestionBox = document.createElement("div");
suggestionBox.id = "suggestions";
document.querySelector(".search").appendChild(suggestionBox);

textarea.addEventListener("input", () => {
  let history = JSON.parse(localStorage.getItem("searchHistory"));
  let term = textarea.value.toLowerCase();

  if (!term) {
    suggestionBox.innerHTML = "";
    return;
  }

  let matches = history.filter((h) => h.toLowerCase().includes(term));

  suggestionBox.innerHTML = matches
    .map((item) => `<div class="suggestion-item">${item}</div>`)
    .join("");

  document.querySelectorAll(".suggestion-item").forEach((item) => {
    item.addEventListener("click", () => {
      textarea.value = item.textContent;
      suggestionBox.innerHTML = "";
    });
  });
});

// Search Button Clicked
searchButton.addEventListener("click", () => {
  if (!textarea.value.trim()) {
    showToast("Please Enter a Title!"); // Showing toast for empty search
    return
  }

  trendingSection.style.display = "none";
  fetchMovie();
});

// Event Listeners for all sidebar open buttons
Array.from(openNavigation).forEach((btn) => {
  btn.addEventListener("click", () => {
    openNav();
  });
});

// Event Listeners for sidebar close button
Array.from(closeNavigation).forEach((btn) => {
  btn.addEventListener("click", () => {
    closeNav();
  });
});

async function fetchMovie() {
  // Async function so as to wait until movies load

  var searchTitle = textarea.value;

  // Emptying the following class to load new data
  document.getElementById("appendData").replaceChildren();
  document.getElementById("loading").replaceChildren();

  // Getting the search history and add the searched title if it doesn't already exist
  let searchHistory = JSON.parse(localStorage.getItem("searchHistory"));
  if (!searchHistory.includes(searchTitle.trim())) {
    searchHistory.push(searchTitle.trim());
  }

  // keeps last 10 searches and sets the new search history
  searchHistory = searchHistory.slice(-10);
  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));

  await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${searchTitle}`
  )
    .then((res) => res.json())
    .then((search) => {
      var data = search.Search;

      // If no movies are found with the searched title
      if (!data) {
        showToast("No movies were found with that name. Please try again!");
        return
      }

      // Initialising container to load movies into
      const appendData = document.getElementById("appendData");

      // Going through every movie in the response list and loading them
      for (let i = 0; i < data.length; i++) {
        let card = document.createElement("div");
        card.className = "movie-card";
        card.setAttribute("data-movie-id", data[i].imdbID);

        const cardInner = document.createElement("div");
        cardInner.setAttribute("data-movie-id", data[i].imdbID);
        cardInner.className = "card card-clickable";

        let cardImage = document.createElement("img");
        cardImage.className = "card-img-top img-fluid";

        if (data[i].Poster !== "N/A") {
          cardImage.src = data[i].Poster;
        } else {
          cardImage.src = "assets/poster404.png";
        }

        cardImage.addEventListener("error", (e) => {
          const img = e.target;
          if (img.src.endsWith("assets/poster404.png")) return;
          img.src = "assets/poster404.png";
        });

        // body
        let cardBody = document.createElement("div");
        cardBody.className = "card-body";

        // title
        let cardTitle = document.createElement("a");
        cardTitle.className = "card-title";
        cardTitle.textContent = data[i].Title;
        cardTitle.addEventListener("click", (event) => {
          event.preventDefault();
          showCard(data[i]);
        });
        cardBody.appendChild(cardTitle);

        // year
        if (data[i].Released !== "N/A") {
          let cardText = document.createElement("p");
          cardText.className = "card-text fs-6";
          cardText.textContent = data[i].Year;
          cardBody.appendChild(cardText);
        }

        // append image and body to cardInner instead of card
        cardInner.appendChild(cardImage);
        cardInner.appendChild(cardBody);

        // finally append structure to the grid column
        card.appendChild(cardInner);
        appendData.appendChild(card);

        isSearching = "false";
      }
    })
    .catch((err) => console.error("Error: ", err));

  textarea.value = "";
}

// Event listeners for the cards loaded in
document.getElementById("appendData").addEventListener("click", (event) => {
  const clickedCard = event.target.closest(".card-clickable");
 
  if (clickedCard) {
    const movieID = clickedCard.dataset.movieId; // movieId is an attribute of the element created

    localStorage.setItem("movieID", movieID);

    window.location.href = "MovieCard.html"; // redirecting
  }
});

// Theme switching event listener if theme button exists
if (themeButton) {
  themeButton.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    let next;
    if (current === "dark") {
      next = "☀️";
    } else {
      next = "🌙";
    }

    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);

    if (next === "dark") {
      themeButton.textContent = "☀️";
    } else {
      themeButton.textContent = "🌙";
    }
  });
}

// Opening sidebar
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

// Closing sidebar
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}

// Clear Search History and visual confirmation in the form of a toast
function clearHistory() {
  localStorage.setItem("searchHistory", JSON.stringify([]));
  showToast("Search history cleared 🧹", "success");
}

// Showing Toast as visual confirmation along with custom message
// Second parameter is made optional to change colour of toast based on need (default is error, being red in colour)
function showToast(message, type = "error") {
  const toast = document.createElement("div");
  toast.className = "removal-toast";
  toast.textContent = message;

  if (type === "success") toast.style.background = "#16a34a";
  else if (type === "warning") toast.style.background = "#f59e0b";
  else toast.style.background = "#dc2626";

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Fetching the Trending Movies from LLM
async function fetchTrendingFromLLM() {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a movie recommendation engine. Respond ONLY with valid JSON. Example: [Movie Title 1, Movie Title 2, ...]",
        },
        {
          role: "user",
          content:
            "Give me a list of 6 currently trending movies. Return ONLY a JSON array of movie titles. Example: [Movie Title 1, Movie Title 2, ...]",
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed with status " + response.status);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Invalid LLM response structure");
  }

  // Checking if response is Valid
  let titles;
  try {
    titles = JSON.parse(content);
  } catch (err) {
    throw new Error("LLM returned non-JSON content");
  }

  if (!Array.isArray(titles)) {
    throw new Error("LLM response is not an array");
  }

  return titles;
}

// Loading trending movies after fetching from LLM
async function loadTrendingMovies() {
  let titles = [];

  // Try loading the response given by LLM
  try {
    titles = await fetchTrendingFromLLM();
  } catch (err) {
    console.error("LLM trending failed:", err);
    showToast("Using fallback trending movies ⚠️", "warning");
    titles = FALLBACK_TRENDING; // Static array gets assigned
  }

  // Loading the pre-defined set of movies
  for (const title of titles) {
    try {
      const movie = await fetchMovieByTitle(title);
      if (movie) renderTrendingCard(movie);
    } catch (e) {
      console.error("OMDb failed for:", title);
    }
  }
}

// Loading by title instead of searching
async function fetchMovieByTitle(title) {
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${title}`
  );

  const data = await res.json();

  if (data.Response === "False") {
    return null;
  }

  return data;
}

// Rendering Pre-Defined Movie Cards
function renderTrendingCard(movie) {
  const container = document.getElementById("trending-container");

  const card = document.createElement("div");
  card.className = "movie-card";

  const inner = document.createElement("div");
  inner.className = "card card-clickable";
  inner.dataset.movieId = movie.imdbID;

  const img = document.createElement("img");
  img.className = "card-img-top img-fluid";
  img.src = movie.Poster !== "N/A" ? movie.Poster : "assets/poster404.png";

  img.onerror = () => {
    img.src = "assets/poster404.png";
  };

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h6");
  title.className = "card-title";
  title.textContent = movie.Title;

  body.appendChild(title);
  inner.appendChild(img);
  inner.appendChild(body);
  card.appendChild(inner);

  card.addEventListener("click", () => {
    localStorage.setItem("movieID", movie.imdbID);
    window.location.href = "MovieCard.html";
  });

  container.appendChild(card);
}
