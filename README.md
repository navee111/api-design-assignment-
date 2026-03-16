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

