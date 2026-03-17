# api-design-assignment-

# Video Game Sales API

A modern GraphQL API for exploring video game sales data with 16,598+ games from 1980-2020. Built with Node.js, Apollo Server, PostgreSQL, and deployed on Railway with automated CI/CD testing.

## Live Demo


**Production API:** [https://api-design-assignment-production.up.railway.app/graphql](https://api-design-assignment-production.up.railway.app/graphql)

Try this query in Apollo Studio:
```graphql
query {
  games(platform: "PS4", limit: 5) {
    name
    year
    genre
    globalSales
  }
}
```

---


## Dataset

- **Source:** [Kaggle - Video Game Sales Dataset](https://www.kaggle.com/datasets/gregorut/videogamesales)
- **Size:** 16,598 games
- **Time Period:** 1980-2020
- **Regions:** North America, Europe, Japan, Other regions
- **Data Points:** 16,598+ records across platforms, genres, and publishers



----



##  Features

- ✅ **GraphQL API** with queries, mutations, and filtering
- ✅ **JWT Authentication** for secure operations
- ✅ **CRUD Operations** on games (Create, Read, Update, Delete)
- ✅ **Advanced Filtering** by platform, genre, publisher, year
- ✅ **Pagination Support** for large datasets
- ✅ **Aggregated Data** for publishers and genres
- ✅ **Automated Testing** with Postman/Newman (23 test cases)
- ✅ **CI/CD Pipeline** with GitHub Actions
- ✅ **Production Deployment** on Railway
- ✅ **Cloud Database** PostgreSQL on Railway



---



###  Architecture

# Tech Stack

**Backend:**
- Node.js 20
- Apollo Server 4 (GraphQL)
- Prisma ORM
- PostgreSQL 14

**Authentication:**
- JWT (JSON Web Tokens)
- bcrypt for password hashing

**DevOps:**
- GitHub Actions (CI/CD)
- Railway (Deployment)
- Newman (API Testing)
- Postman (Test Suite)



### API Design


**Resources:**
1. **Game** (Primary - Full CRUD)
   - Create, Read, Update, Delete operations
   - Requires JWT authentication for mutations
   
2. **Publisher** (Secondary - Read-only)
   - Aggregated data from games
   - Total games and sales per publisher
   
3. **Genre** (Secondary - Read-only)
   - Aggregated data from games
   - Average sales per genre

---



### Getting Started


### Prerequisites


- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Installation


1. **Clone the repository:**
   ```bash
   git clone https://github.com/navee111/api-design-assignment-.git
   cd api-design-assignment-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/videogame_api"
   JWT_SECRET="secret-key-here"
   PORT=4000
   ```

4. **Create database:**
   ```bash
   createdb videogame_api
   ```

5. **Run migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

6. **Seed database:**
   ```bash
   npm run seed
   ```
   
   This will import 16,598 games from the CSV dataset.

7. **Start server:**
   ```bash
   npm run dev
   ```
   
   Server runs at: `http://localhost:4000/graphql`

---



### API Documentation

### Authentication


#### Register
```graphql
mutation {
  register(
    email: "user@example.com"
    password: "securepassword"
    name: "John Doe"
  ) {
    token
    user {
      id
      email
      name
    }
  }
}
```

#### Login
```graphql
mutation {
  login(
    email: "user@example.com"
    password: "securepassword"
  ) {
    token
    user {
      id
      email
    }
  }
}
```

**Note:** Copy the `token` from the response for authenticated requests.

---



### Queries (Public)

#### Get Games with Filters
```graphql
query {
  games(
    platform: "PS4"
    genre: "Action"
    yearMin: 2010
    yearMax: 2020
    limit: 10
    offset: 0
  ) {
    id
    name
    platform
    year
    genre
    publisher
    globalSales
    naSales
    euSales
    jpSales
  }
}
```

#### Get Single Game
```graphql
query {
  game(id: "1") {
    id
    name
    platform
    year
    genre
    publisher
    globalSales
  }
}
```

#### Get Publishers
```graphql
query {
  publishers(limit: 10) {
    name
    totalGames
    totalSales
    games {
      name
      platform
    }
  }
}
```

#### Get Genres
```graphql
query {
  genres {
    name
    totalGames
    averageSales
  }
}
```

---

### Mutations (Requires Authentication)

**Add this header for authenticated requests:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

#### Create Game
```graphql
mutation {
  createGame(input: {
    name: "New Game Title"
    platform: "PS5"
    year: 2024
    genre: "Action"
    publisher: "Game Studio"
    naSales: 1.5
    euSales: 1.2
    jpSales: 0.8
    otherSales: 0.5
  }) {
    id
    name
    globalSales
  }
}
```

#### Update Game
```graphql
mutation {
  updateGame(
    id: "123"
    input: {
      name: "Updated Title"
      naSales: 2.0
    }
  ) {
    id
    name
    globalSales
  }
}
```

#### Delete Game
```graphql
mutation {
  deleteGame(id: "123") {
    id
    name
  }
}
```

---

## Testing

### Run Tests Locally

**With Newman CLI:**
```bash
npm install -g newman
newman run VideoGameAPI.postman_collection.json -e Local.postman_environment.json
```

**With Postman:**
1. Import `VideoGameAPI.postman_collection.json`
2. Import `Local.postman_environment.json`
3. Select environment (top right)
4. Run collection (right-click → Run collection)

### Test Coverage

**23 automated test cases:**
- ✅ Authentication (4 tests)
  - User registration (success + duplicate email)
  - Login (success + invalid credentials)
  
- ✅ Game Queries (7 tests)
  - Get all games
  - Get by ID (success + not found)
  - Filter by platform, genre, year
  - Pagination
  
- ✅ Publishers & Genres (4 tests)
  - Get all publishers/genres
  - Get by name
  
- ✅ Game Mutations (6 tests)
  - Create, update, delete (authenticated)
  - Unauthorized attempts
  
- ✅ Complex Queries (2 tests)
  - Multi-parameter filtering
  - Partial text search

---

## CI/CD Pipeline

### GitHub Actions

Automated testing runs on every push to `main` branch.

**Workflow:** `.github/workflows/test.yml`

**Pipeline Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Install Newman
4. ✅ Run 23 Postman tests against production API
5. ✅ Upload test results as artifacts
6. ✅ Build validation

**View Results:**
- GitHub → Actions tab
- See all test runs and results
- Download test artifacts

---

##  Deployment

### Production (Railway)

**Live URL:** https://api-design-assignment-production.up.railway.app/graphql

**Deployment Process:**
1. Push to GitHub main branch
2. Railway auto-deploys
3. Database migrations run automatically
4. GitHub Actions tests the deployment

**Services:**
- **Web Service:** Node.js API (Railway)
- **Database:** PostgreSQL 14 (Railway)

**Environment Variables (Railway):**
```
DATABASE_URL=<auto-configured>
JWT_SECRET=<secure-random-key>
NODE_ENV=production
```

---

##  Project Structure

```
api-design-assignment-/
├── .github/
│   └── workflows/
│       └── test.yml                    # GitHub Actions CI/CD
├── prisma/
│   ├── schema.prisma                   # Database schema
│   ├── seed.js                         # Data import script
│   └── vgsales.csv                     # Dataset (16,598 games)
├── src/
│   ├── index.js                        # Apollo Server setup
│   ├── schema.js                       # GraphQL type definitions
│   ├── resolvers.js                    # Query/Mutation resolvers
│   └── auth.js                         # JWT utilities
├── VideoGameAPI.postman_collection.json # Test suite
├── Local.postman_environment.json       # Environment config
├── .env                                # Environment variables (local)
├── .gitignore
├── package.json
└── README.md
```

---

## Design Decisions

### Why GraphQL?
- **Flexible queries:** Clients request exactly what they need
- **Single endpoint:** `/graphql` for all operations
- **Strong typing:** Schema-first development
- **Great developer experience:** Apollo Studio for testing

### Why Prisma ORM?
- **Type-safe database access**
- **Auto-generated migrations**
- **Intuitive query API**
- **Great PostgreSQL support**

### Why Railway?
- **Easy deployment** from GitHub
- **Auto-scaling** and monitoring
- **Integrated PostgreSQL** database
- **Environment management**
- **Free tier** suitable for projects

### Why JWT Authentication?
- **Stateless** authentication
- **Scalable** (no server-side sessions)
- **Standard** implementation
- **Secure** with bcrypt password hashing

---

##  Error Handling

The API returns descriptive error messages:

**Authentication Errors:**
```json
{
  "errors": [{
    "message": "Not authenticated",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

**Not Found Errors:**
```json
{
  "errors": [{
    "message": "Game not found",
    "extensions": { "code": "NOT_FOUND" }
  }]
}
```

**Validation Errors:**
```json
{
  "errors": [{
    "message": "User already exists",
    "extensions": { "code": "BAD_USER_INPUT" }
  }]
}
```

---

## Performance

- **Indexed queries** on platform, genre, publisher, year
- **Pagination support** (limit/offset)
- **Connection pooling** via Prisma
- **Efficient aggregations** for publishers/genres

---

## Security

- ✅ **JWT tokens** with 7-day expiration
- ✅ **bcrypt** password hashing (10 rounds)
- ✅ **Input validation** via GraphQL schema
- ✅ **SQL injection protection** via Prisma ORM
- ✅ **Authentication required** for mutations

---

## Assignment Requirements

This project fulfills all assignment requirements:

- ✅ **GraphQL API** implementation
- ✅ **1 Primary Resource** (Game) with full CRUD
- ✅ **2 Secondary Resources** (Publisher, Genre) read-only
- ✅ **10,000+ data points** (16,598 games)
- ✅ **JWT Authentication** for protected operations
- ✅ **Filtering and pagination** capabilities
- ✅ **Automated testing** (23 test cases)
- ✅ **CI/CD pipeline** with GitHub Actions
- ✅ **Public deployment** on Railway
- ✅ **Documentation** (README)

---

## Author

**Navid**
- GitHub: [@navee111](https://github.com/navee111)
- University: Linnaeus University
- Course: API Design (1DV027)

---

## License

This project is created for educational purposes as part of a university assignment.

Dataset source: [Kaggle - Video Game Sales](https://www.kaggle.com/datasets/gregorut/videogamesales)

---

##  Acknowledgments

- **Dataset:** Gregory Smith on Kaggle
- **Course:** 1DV027 API Design, Linnaeus University
- **Technologies:** Node.js, Apollo Server, Prisma, Railway, GitHub Actions

---

## Support

For questions or issues:
1. Check the API documentation above
2. Review test cases in Postman collection
3. Check GitHub Actions logs for CI/CD issues

---

**Built with using GraphQL, Node.js, and PostgreSQL**