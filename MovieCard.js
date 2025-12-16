// All constants declaration including API keys

const closeNavigation = document.getElementsByClassName("closebtn");
const openNavigation = document.getElementsByClassName("sidebar_button");

const backButton = document.getElementsByClassName("back_button");

const OMDB_API_KEY = "Your OMDB Key Here";
const OPENAI_API_KEY = "Your OpenAI Key Here";

const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

const toastContainer = document.getElementById("toast-container");

// On Page Loading
window.onload = async function () {
  // Loading theme
  const btn = document.getElementById("themeBtn");
  if (btn) {
    if (savedTheme === "dark") {
      btn.textContent = "☀️";
    } else {
      btn.textContent = "🌙";
    }
  }

  // Getting ID of movie to be loaded.
  const movieID = localStorage.getItem("movieID");
  await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movieID}&r=json&plot=full`
  )
    .then((response) => response.json())
    .then((movie) => {
      const container = document.querySelector(".card-outer");
      container.innerHTML = "";

      const card = document.createElement("div");
      card.className = "movie-card";

      const poster = document.createElement("img");
      poster.className = "movie-poster";
      poster.src =
        movie.Poster !== "N/A" ? movie.Poster : "assets/no-image.png";

      const details = document.createElement("div");
      details.className = "movie-details";

      const ratingBadge = `
          <span class="rating-badge">⭐ ${movie.imdbRating}</span>
      `;

      details.innerHTML = `
          ${ratingBadge}
          <div class="movie-title">${movie.Title} (${movie.Year})</div>
          <div class="movie-meta"><strong>Genres:</strong> ${movie.Genre}</div>
          <div class="movie-meta"><strong>Runtime:</strong> ${movie.Runtime}</div>
          <div class="movie-meta"><strong>Languages:</strong> ${movie.Language}</div>
          <div class="movie-meta"><strong>Director:</strong> ${movie.Director}</div>
          <div class="movie-plot">${movie.Plot}</div>
      `;

      const watch_later_Btn = document.createElement("button");
      watch_later_Btn.className = "watch_later-btn";
      watch_later_Btn.textContent = "Add to Watch Later";

      let watchLater = JSON.parse(localStorage.getItem("watchLater") || "[]");

      function updateButton() {
        if (watchLater.includes(movie.imdbID)) {
          watch_later_Btn.textContent = "Remove from Watch Later";
          watch_later_Btn.classList.add("remove-mode");
        } else {
          watch_later_Btn.textContent = "Add to Watch Later";
          watch_later_Btn.classList.remove("remove-mode");
        }
      }

      updateButton();

      watch_later_Btn.onclick = () => {
        let list = JSON.parse(localStorage.getItem("watchLater") || "[]");
        const feedback = document.getElementById("watchlater-feedback");

        let added = false;

        if (list.includes(movie.imdbID)) {
          // Remove Movie
          list = list.filter((id) => id !== movie.imdbID);
          feedback.textContent = "✖ Removed";
        } else {
          // Add Movie
          list.push(movie.imdbID);
          feedback.textContent = "✔ Added";
          added = true;
        }
        
        // Showing visual feedback of interaction 
        feedback.classList.add("show");
        setTimeout(() => {
          feedback.classList.remove("show");
        }, 2000); // Lasts for 2 seconds

        localStorage.setItem("watchLater", JSON.stringify(list));
        watchLater = list;
        updateButton();
      };

      details.appendChild(watch_later_Btn);

      card.appendChild(poster);
      card.appendChild(details);
      container.appendChild(card);
      loadLLMRecommendations(movie); // Getting recommendations based on movie
    });
};


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

// Theme Button 
document.getElementById("themeBtn").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);

  document.getElementById("themeBtn").textContent =
    next === "dark" ? "☀️" : "🌙";
});

// Back button to return to previous window
Array.from(backButton).forEach((btn) => {
  btn.addEventListener("click", () => {
    window.history.back();
  });
});

// Getting Recommendations from LLM
async function getLLMRecommendations(title) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a movie recommendation engine. Respond ONLY with JSON.",
        },
        {
          role: "user",
          content: `Suggest 6 movies similar to "${title}". Return ONLY a JSON array of movie titles.`,
        },
      ],
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// Fetch Recommendations from OMBDb API
async function loadLLMRecommendations(movie) {
  const container = document.getElementById("recommendations-container");
  container.innerHTML = "";

  let titles;
  try {
    titles = await getLLMRecommendations(movie.Title);
  } catch (err) {
    showToast("Failed to load recommendations 😕", "warning");
    console.error(err);
    return;
  }

  for (const title of titles) {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(
        title
      )}`
    );
    const rec = await res.json();

    if (rec.Response === "True" && rec.imdbID !== movie.imdbID) {
      renderRecommendationCard(rec);
    }
  }
}

// Render the Recommendations into their container
function renderRecommendationCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";

  const inner = document.createElement("div");
  inner.className = "card card-clickable";
  inner.dataset.movieId = movie.imdbID;

  const img = document.createElement("img");
  img.className = "card-img-top img-fluid";
  img.src = movie.Poster !== "N/A" ? movie.Poster : "assets/poster404.png";

  const body = document.createElement("div");
  body.className = "card-body text-center";

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

  document.getElementById("recommendations-container").appendChild(card);
}

// Showing Toast as visual confirmation along with custom message
// Second parameter is made optional to change colour of toast based on need (default is error, being red in colour)
function showToast(message, type = "error") {
  if (!toastContainer) return;

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

// Opening sidebar
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.querySelector(".back_button").style.display = "none"; // HIDE BACK BUTTON
}

// Closing sidebar
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.querySelector(".back_button").style.display = "flex"; // SHOW BACK BUTTON AGAIN
}
