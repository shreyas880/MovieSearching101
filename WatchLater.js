// All constants declaration including API keys

const closeNavigation = document.getElementsByClassName("closebtn");
const openNavigation = document.getElementsByClassName("sidebar_button");

const OMDB_API_KEY = "Your OMDB Key Here";

const watchtime_input = document.getElementById("watch-time-input");

const themeBtn = document.getElementById("themeBtn");

var movie_obj = {};

let toastContainer = document.querySelector(".toast-container");

// Create Toast Container if it doesn't exist
if (!toastContainer) {
  toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);
}

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

// On Page Load
window.onload = () => {
  // Getting theme and loading it in from local storage
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  // Initialise watch time
  localStorage.setItem("WatchTime", "0");

  // Creating container to load "watch later" movies
  const container = document.createElement("div");
  container.id = "appendData";
  document.body.appendChild(container);
  
  // Get List of Movies in WatchLater and load each one
  let movies = JSON.parse(localStorage.getItem("watchLater") || "[]");
  movies.forEach((id) => loadMovie(id));
};

// Dynamically update Total Watch Time at the top right of the screen
function updateTotalWatchTimeUI() {
  const badge = document.getElementById("total-watchtime");
  if (!badge) return;
  badge.textContent = `Total: ${localStorage.getItem("WatchTime")} mins`;
}

// Load movies from OMBDb API
async function loadMovie(id) {
  await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}`)
    .then((res) => res.json())
    .then((movie) => {
      // Functional Logic to update Total watch time
      var WatchTime = Number(localStorage.getItem("WatchTime"));
      var runtime = movie.Runtime.split(" ")[0];
      if (runtime === "N/A") runtime = 0;
      WatchTime = WatchTime + Number(runtime);
      localStorage.setItem("WatchTime", `${WatchTime}`); // Updating watch time in storage
      updateTotalWatchTimeUI();

      rating = movie.Ratings[0].Value.split("/")[0]; // Getting IMDB rating from API response

      // Update Object to be used by sorting algorithm
      movie_obj[id] = {
        Runtime: runtime,
        Title: movie.Title,
        Rating: rating,
      };

      // Displaying the movie
      displayCard(movie);
    });
}

// Theme toggle logic
themeBtn.addEventListener("click", () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark";

  document.documentElement.setAttribute("data-theme", currentTheme);
  localStorage.setItem("theme", currentTheme);
  themeBtn.textContent = currentTheme === "dark" ? "☀️" : "🌙";
});

// Event listener for card being clicked and redirecting to MovieCard.html
document.addEventListener("click", (event) => {
  const clicked = event.target.closest(".card-clickable");
  if (clicked) {
    redirectToMovie(clicked.dataset.movieId);
  }
});

// Getting input for optimising based on available time
watchtime_input.addEventListener("keydown", (keyEvent) => {
  var input_time = watchtime_input.value;
  if (keyEvent.code === "Enter") {
    if (watchtime_input.value !== "") {
      movieTimeCalc(input_time);
      watchtime_input.value = "";
    } else {
      showToast("Please enter available watch time ⏱️", "warning");
    }
  }
});

// Checking if Total Watch Time is less than Available Time 
function movieTimeCalc(input_time) {
  var watchtime = Number(localStorage.getItem("WatchTime")); // getting total watch time from localstorage

  const sorting = document.getElementsByName("Sorting"); // getting the elements in the class and checking which one is chosen
  var sorting_mode;
  sorting.forEach((ele) => {
    if (ele.checked) sorting_mode = ele.value;
  });

  input_time = Number(input_time); // converting input into number

  if (input_time >= watchtime) {
    updateTotalWatchTimeUI(); // updating total watch time after optimisation
    showToast("Movies optimised for selected mode ✅", "success");
  } else {
    movieRemoval(input_time, sorting_mode);
  }
}

// Optimising Logic
function movieRemoval(input_time, sorting_mode) {
  var movieArr = Object.values(movie_obj);

  var removalId, title;

  var removalRunTime = 0;
  var removalRating = 10;
  var removalEfficiency = 10;

  movieArr.forEach((obj) => {
    let time = Number(obj["Runtime"]);
    let rating = Number(obj["Rating"]);
    let efficiency = Number(rating / time);

    if (sorting_mode === "Runtime") {
      // Longest movie
      if (time >= removalRunTime) {
        removalRunTime = time;
        removalRating = rating;
      }
    } else if (sorting_mode === "Rating") {
      // Worst movie
      if (rating < removalRating) {
        removalRunTime = time;
        removalRating = rating;
      }
    } else if (sorting_mode === "Effi") {
      // Rating/time
      if (efficiency <= removalEfficiency) {
        removalRunTime = time;
        removalRating = rating;
      }
    } else {
      // error case
      showToast("An error occured! Please choose a mode again.");
    }
  });

  Object.keys(movie_obj).forEach((key) => {
    if (Number(movie_obj[key]["Runtime"]) === removalRunTime && Number(movie_obj[key]["Rating"]) === removalRating) {
      removalId = key;
      title = movie_obj[key]["Title"];
    }
  });

  // Updating Total Watch Time
  let watchtime = Number(localStorage.getItem("WatchTime"));
  watchtime -= removalRunTime;
  localStorage.setItem("WatchTime", watchtime);

  // Remove the movie from the object
  delete movie_obj[removalId];

  const card = document.querySelector(`[data-movie-id=${removalId}]`);
  removeFromWatchLater(removalId, card); // Removing from Watch Later list
  showToast(`Removed: ${title}`, "error");
  movieTimeCalc(input_time); // Check again if Total Watch Time < Available time
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

// Displaying the cards in a form similar to searching
function displayCard(movie) {
  const appendData = document.getElementById("appendData");

  let card = document.createElement("div");
  card.className = "movie-card";
  card.setAttribute("data-movie-id", movie.imdbID);

  const cardInner = document.createElement("div");
  cardInner.className = "card card-clickable";
  cardInner.setAttribute("data-movie-id", movie.imdbID);

  // poster
  let cardImage = document.createElement("img");
  cardImage.className = "card-img-top img-fluid";
  cardImage.src =
    movie.Poster !== "N/A" ? movie.Poster : "assets/poster404.png";

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
  cardTitle.innerHTML = `
    ${movie.Title}
    <div class="rating">⭐ ${movie.imdbRating || "N/A"}</div>
  `;
  cardTitle.addEventListener("click", (event) => {
    event.preventDefault();
    redirectToMovie(movie.imdbID);
  });

  // year
  let cardText = document.createElement("p");
  cardText.className = "card-text fs-6";
  cardText.textContent = movie.Year;

  // runtime (NEW)
  let runtimeText = document.createElement("p");
  runtimeText.className = "card-text fs-6";
  runtimeText.textContent =
    movie.Runtime && movie.Runtime !== "N/A" ? movie.Runtime : "Runtime: N/A";

  // assembly
  cardBody.appendChild(cardTitle);
  cardBody.appendChild(cardText); // Year
  cardBody.appendChild(runtimeText); // Runtime

  // REMOVE BUTTON
  let removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", (event) => {
    var WatchTime = Number(localStorage.getItem("WatchTime"));
    var runtime = movie.Runtime.split(" ")[0];
    if (runtime === "N/A") runtime = 0;

    event.stopPropagation(); // prevent redirect
    WatchTime = WatchTime - Number(runtime);
    localStorage.setItem("WatchTime", `${WatchTime}`);
    updateTotalWatchTimeUI();

    removeFromWatchLater(movie.imdbID, card);
    showToast(`Removed: ${movie.Title}`, "error");
  });
  cardBody.appendChild(removeBtn);

  cardInner.appendChild(cardImage);
  cardInner.appendChild(cardBody);
  card.appendChild(cardInner);

  appendData.appendChild(card);
}

// Removing Specified Movie
function removeFromWatchLater(id, cardElement, Title) {
  let list = JSON.parse(localStorage.getItem("watchLater") || "[]");
  list = list.filter((m) => m !== id); // Only keep movie for which the movieID doesn't match ID of movie being removed
  localStorage.setItem("watchLater", JSON.stringify(list)); // Set updated list
  cardElement.remove();
}

// Redirect to MovieCard.html
function redirectToMovie(id) {
  localStorage.setItem("movieID", id);
  window.location.href = "MovieCard.html";
}

// Opening sidebar
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

// Closing sidebar
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}
