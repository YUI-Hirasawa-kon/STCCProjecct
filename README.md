# Movie System

## Project Information
- Project Name:Movie System
- Group Information：Group 55;member:<Chung Ho Long (s1420415)>, <Kwok Yu Chun (s1411691)>,<Wong Kai Yuen (s1415545)>,<Chan Lee Po (s1421223)>
- Cloud url:'https://stccprojecct.onrender.com/'

## Project Files
- `server.js`
  - Load environment variables, database connection (`config/database.js`), configure session, template engine and static resources.
  - Mounted routes: '/' (homepage and movie display), `/admin` (admin panel), `/api` (public API), `/auth` (login/logout/data).
  - Built-in HTTP server startup logic (supports direct startup via `node server.js`), including port normalization, error handling, and monitoring logs.
- `package.json`
  - dependency:`express`、`ejs`、`mongoose`、`express-session`、`method-override`、`dotenv`、`bcrypt`.
  - script:`start`（`node server.js`）、`dev`（`nodemon server.js`）、`debug`（`DEBUG=movie-system:* nodemon server.js`）
- `public/`
  - `stylesheets/style.css`:Global Styles
- `views/`
  - `index.ejs`、`error.ejs`、`layout.ejs`
  - `movies/`:`detail.ejs`、`filtered.ejs`
  - `admin/`:`dashboard.ejs`、`create-movie.ejs`、`edit-movie.ejs`、`movie-form.ejs`
  - `auth/`:`login.ejs`、`profile.ejs`
- `models/`
  - `Movie.js`:Movie model (title, description, poster URL, rating `I|IIA|IIB|III`, release date, director, genre, runtime, etc.).
  - `Manager.js`:Administrator model (username, password hash, role `admin|superadmin`, etc.); provides the `comparePassword` method.
  - `models/index.js`:Initialize the index and default administrator account (automatically created on the first run: `test/test123`).
- `routes/`
  - `index.js`:(Homepage and movie display), `admin.js` (backend management and form submission), `api.js` (REST API), `auth.js` (login/logout/data).
- `config/`
  - `database.js`:Connect to MongoDB, create indexes, and initialize the default administrator on the first run.


## Cloud URL
- Cloud test address:'https://stccprojecct.onrender.com/'


## Operation Guides
### Login/Logout
-Login: `GET /auth/login`; Logout: `GET /auth/logout`
- Default account (automatically created on first launch):
  - username:`test`
  - password:`test123`
- The production environment needs to be set in the cloud environment variables:`MONGODB_ATLAS_URI`

### Backend webpage (CRUD)
- Entrance:`/admin`
- Create: Click`Add New Movie` Proceed to the creation page; fill in the required fields and submit to save.
- Read: The background list is clickable.`View` View details (`/movies/:id`).
- Update: Click `Edit` to enter the editing page; after making changes, click `Update Movie` to submit.
- To delete: Click `Delete`.

### RESTful CRUD APIs
- Base address: `/api`
- Read list `GET /api/movies`
  - Supported parameters:`rating`、`genre`、`director`、`isFull`、`comingSoon`、`page`、`limit`、`sort`
- Details:`GET /api/movies/<movie_id>`
- Create:`POST /api/movies`
  - Required:`title, description, posterUrl, rating, releaseDate, director, genres, duration`
- Update:`PUT /api/movies/<movie_id>`
- Delete:`DELETE /api/movies/<movie_id>`
- Statistics:`GET /api/stats/movies`

### CURL Test Example

- "poster url demo:
https://scholars.hkmu.edu.hk/files-asset/19040519/5619180f6b22b3be379691a86a293cdf.jpg/

- Read:
curl "https://stccprojecct.onrender.com/api/movies"
- Details:
curl "https://stccprojecct.onrender.com/api/movies/<movie_id>"

- Create:
  - (Linux):curl -X POST "https://stccprojecct.onrender.com/api/movies" -H "Content-Type: application/json" -d '{"title": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "description": "Classic action film", "posterUrl": "https://scholars.hkmu.edu.hk/files-asset/19040519/5619180f6b22b3be379691a86a293cdf.jpg/
", "rating": "IIB", "releaseDate": "2025-11-14", "director": "Jackie Chan", "genres": ["Action", "Crime"], "duration": 100, "language": "Cantonese", "theaterLocation": "HongKong", "cast": ["Jackie Chan", "Brigitte Lin"], "showTimes": ["14:30", "19:30"]}'
  - (window):curl -X POST "https://stccprojecct.onrender.com/api/movies" -H "Content-Type: application/json" -d "{\"title\": \"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", \"description\": \"Classic action film\", \"posterUrl\": \"https://scholars.hkmu.edu.hk/files-asset/19040519/5619180f6b22b3be379691a86a293cdf.jpg/", \"rating\": \"IIB\", \"releaseDate\": \"2025-11-14\", \"director\": \"Jackie Chan\", \"genres\": [\"Action\", \"Crime\"], \"duration\": 100, \"language\": \"Cantonese\", \"theaterLocation\": \"HongKong\", \"cast\": [\"Jackie Chan\", \"Brigitte Lin\"], \"showTimes\": [\"14:30\", \"19:30\"]}"

- Update:
  - (Linux):curl -X PUT "https://stccprojecct.onrender.com/api/movies/69241ad55f9d94971d5ad11d" \
     -H "Content-Type: application/json" \
     -d '{ "duration": 95, "isFull": true }'

  - (window):curl -X PUT "https://stccprojecct.onrender.com/api/movies/<movie_id>" -H "Content-Type: application/json" -d "{"duration": 95, "isFull": true}"

- Delete:
curl -X DELETE "https://stccprojecct.onrender.com/api/movies/69241ad55f9d94971d5ad11d"

## Setup & Run
- Install dependencies:`npm install`
- Start locally:`npm start` or `node server.js`
- Environment variables:
  - `MONGODB_ATLAS_URI`：MongoDB connection string
  - `SESSION_SECRET`：Strong random key, used for session signing

