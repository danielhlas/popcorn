import { setSelectionRange } from "@testing-library/user-event/dist/utils";
import {useEffect, useState } from "react";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

//////////////////////////////////////////////
/////////////////   APP   ////////////////////
//////////////////////////////////////////////
export default function App() {
  const [query, setQuery] = useState("Lord"); //vyhledávaný film

  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(function() { //při initial render čteme data z prohlížeče
    const storedValue = localStorage.getItem("watched");
    if (storedValue === null) return []; //early return
    return JSON.parse(storedValue);
  })

  // const [searching, setSearching] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  
  const [isOpen1, setIsOpen1] = useState(true);
  const [isOpen2, setIsOpen2] = useState(true);

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("") 

  function addMovie(MovieData, rating){ //zvolený film přidá do seznamu watched
    const newMovie = {
      imdbID: MovieData.imdbID,
      Title: MovieData.Title,
      Year: MovieData.Year,
      Poster: MovieData.Poster,
      imdbRating: MovieData.imdbRating,
      runtime: MovieData.Runtime,
      userRating: rating
    }
   setWatched(watched => [...watched, newMovie])
  }

  function deleteMovie(imdbID){ //smaže film ze seznamu watched
    setWatched (watched.filter((movie) => movie.imdbID !==imdbID ))
  }
  
useEffect(
  function () {
    const controller = new AbortController(); //umožnuje abort http request
	  
    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("")
        
        const res = await fetch(
          `http://www.omdbapi.com/?i=tt3896198&apikey=e7a4bb48&s=${query}`, 
          {signal: controller.signal}
        );

        if (!res.ok) throw new Error("Something went wrong");

        const data = await res.json()

        if (data.Response === "False") throw new Error("Movie not found")
        setMovies(data.Search);

    } catch (err) {
      if(err.name !=="AbortError"){
          setError(err.message);
        }

    } finally {
      setIsLoading(false);
    }
	}

  if (query.length < 4) { //Nejsou-li vyhledány aspoň 4 písmena, není poslán request na API
    setMovies([])
    setError("")
    return;
  }

  setSelectedId(null) //při vyhledávání zavře otevřený film
	fetchMovies() 

  return function() { //cleanup fce
    controller.abort();
  }
}, [query]);

  
useEffect(function() { //Ukládá data do prohlížeče
	localStorage.setItem("watched", JSON.stringify(watched))
}, [watched])

  return (
  <>
    <Nav movies={movies} query={query} setQuery={setQuery}/>

    <main className="main">
      <Box isOpen={isOpen1} setIsOpen={setIsOpen1}>
        {isLoading && <Loader/>}
        {!isLoading && !error && <SearchedMovies movies={movies} setSelectedId={setSelectedId}/>}
        {error && <ErrorMessage message={error}/>}
      </Box>

      <Box isOpen={isOpen2} setIsOpen={setIsOpen2}>

      <WatchedSummary watched={watched}/>

        {selectedId ? 
        <SelectedMovie 
          selectedId={selectedId} 
          setSelectedId={setSelectedId} 
          addMovie={addMovie}
          watched={watched}
          /> 
        : <WatchedMovies watched={watched} deleteMovie={deleteMovie}/>}
      </Box>
    </main>
  </>
  );
}


//////////////////////////////////////////////
/////////////////   NAV   ////////////////////
//////////////////////////////////////////////
function Nav({movies, query, setQuery}) {
  
    return(
    <nav className="nav-bar">
      <div className="logo">
        <span role="img">🍿</span>
        <h1>Popcorn</h1>
      </div>

      <input
        className="search"
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        />

      <p className="num-results">
         {movies.length} results found 
      </p>
  </nav>
  )
}



//////////////////////////////////////////////
//////////////   SearchedMovies   ////////////
//////////////////////////////////////////////
function SearchedMovies({movies, setSelectedId}){

  return(
    <ul className="list list-movies">
    {movies?.map((movie) => (
      <li key={movie.imdbID} onClick={() => setSelectedId(movie.imdbID)}>
        <img src={movie.Poster} alt={`${movie.Title} poster`} />
        <h3>{movie.Title}</h3>
        <div>
          <p>
            <span>📅</span>
            <span>{movie.Year}</span>
          </p>
        </div>
      </li>
    ))}
  </ul>
  )
}


//////////////////////////////////////////////
//////////////   Error Messages   ////////////
//////////////////////////////////////////////
function ErrorMessage({message}) {
  return (
    <p className="error"> {message} </p>
  )
}

//////////////////////////////////////////////
//////////////   WatchedMovies   ////////////
//////////////////////////////////////////////
function WatchedMovies({ watched, deleteMovie }) {

  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return(<ul className="list">
    {watched?.map((movie) => (
      <li key={crypto.randomUUID()}>
        <img src={movie.Poster} alt={`${movie.Title} poster`} />
        <h3>{movie.Title}</h3>
        <div>
          <p>
            <span>⭐</span>
            <span>{movie.imdbRating}</span>
          </p>
          <p>
            <span>🌟</span>
            <span>{movie.userRating}</span>
          </p>
          <p>
            <span>⌛</span>
            <span>{movie.runtime}</span>
          </p>
          <button className="btn-delete" onClick={() => deleteMovie(movie.imdbID)}>X</button>
        </div>
      </li>
    ))}
    </ul>
  )
}


//////////////////////////////////////////////
//////////////////   Box   ///////////////////
//////////////////////////////////////////////
function Box({ isOpen=true, setIsOpen, children }){
  return(
    <div className="box">
    <button
      className="btn-toggle"
      onClick={() => setIsOpen((open) => !open)}
      >
      {isOpen ? "–" : "+"}
    </button>
    
    {isOpen && children}

  </div>
  )
}


//////////////////////////////////////////////
/////////////////   Rating   /////////////////
//////////////////////////////////////////////
function Rating({rating, setRating}) {
  const [hoverRating, setHoverRating] = useState(0)

  return(
    <div className="ratingContainer">
      <div className="starContainer">
        {Array.from(
          {length: 10},
          (_, i) => (<Star key={i} onRate={() => setRating(i + 1)} 
          full={hoverRating ? hoverRating >= i+1 : rating >= i+1} onHoverIn={() => setHoverRating(i+1)}
          onHoverOut={() => setHoverRating(0)}  />
        )
        )}
      </div>
      <p> {hoverRating ? hoverRating : rating} </p>
    </div>

  )

}

//////////////////////////////////////////////
/////////////////    Star    /////////////////
//////////////////////////////////////////////
function Star({onRate, full, onHoverIn, onHoverOut}){
  return(
  <span onMouseEnter={(onHoverIn)} onMouseLeave={(onHoverOut)} role="button" onClick={onRate} className="starStyle">
    {full ? (<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="#FFEB00"
    stroke="#FFEB00"
  >
    <path
      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
    />
  </svg>)
  :
(<svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="#FFEB00"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>)}
</span>)
}


//////////////////////////////////////////////
///////////////    Loader    /////////////////
//////////////////////////////////////////////
function Loader(){
  return(<div className="box">
    <p className="loader">Loading data... ↻</p>
  </div>)
}



//////////////////////////////////////////////
////////////    SelectedMovie    /////////////
//////////////////////////////////////////////
function SelectedMovie({selectedId, setSelectedId, addMovie, watched}){
const [MovieData, setMovieData] = useState([])
const [isLoading2, setIsLoading2] = useState(false)
const [rating, setRating] = useState(0)

const arrayWatchedId = watched.map((i) => i.imdbID)
const wasWatched = arrayWatchedId.includes(selectedId)
const movieRating = watched.find(i => i.imdbID === selectedId)?.userRating

  useEffect(function () {
    setIsLoading2(true)
    async function fetchSelectedMovie() {
      const res = await fetch(
        `http://www.omdbapi.com/?apikey=e7a4bb48&i=${selectedId}`
      );
      const fetchedMovieData = await res.json()
      setMovieData(fetchedMovieData)
      setIsLoading2(false)
    }
    fetchSelectedMovie()
    setRating(null)
    
},[selectedId])


useEffect(
  function () {
    if (!MovieData) return;
    document.title = MovieData.Title
    
      return function() {
        document.title ="Popcorn"
      };
    }, [MovieData] 
  );


  return(
    <div className="details">

  {isLoading2 ? <Loader/> : <>
    <header> 
      <button className="btn-back" onClick={() => setSelectedId(null)}> ⬅ </button>
      <img src={MovieData.Poster} alt="poster of the selected movie"/>
      <div className="details-overview"> 
        <h2>{MovieData.Title}</h2> 
        <p> {MovieData.Released} {MovieData.Runtime}  </p>
        <p>{MovieData.Genre}</p>
        <p>⭐{MovieData.imdbRating}</p>
      </div>
    </header>

    <section>
      <div className="rating">

        <Rating rating={wasWatched ? movieRating : rating} setRating={setRating}/>

        {!wasWatched  ?
        <button className="btn-add" onClick={() => rating>0 ? addMovie(MovieData, rating) : alert("Rate this movie first!")}>
          Add to the list
         </button>
        :<button className="btn-add"> Already on your list</button>
        }

      </div>
      <p>Plot: {MovieData.Plot} </p>
      <p>Starring: {MovieData.Actors}</p>
      <p>Director: {MovieData.Director}</p>
    </section>
    </>}
  </div>
  )

}



//////////////////////////////////////////////
///////////////    Summary    ////////////////
//////////////////////////////////////////////
function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(1)}</span>
        </p>
      </div>
    </div>
  );
}