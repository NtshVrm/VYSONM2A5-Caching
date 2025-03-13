# VYSONM2A5

## URL Shortener API

A simple URL shortening service built with Node.js, Express, and TypeORM.

## Features

- Shorten long URLs to unique codes
- Redirect short codes to original URLs
- View all stored URLs
- Delete shortened URLs
- View stored logs
- handle rate limits based on api key and user tier

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)
- PostgreSQL database

## Database

The application uses PostgreSQL as its database. The database connection details are specified in the `db/db.datasource.ts` file.

## Implementation Details

The project uses TypeORM for database interactions, allowing for easy management of entities and relationships.

## Installation

1. Clone the repository:

```sh
git clone https://github.com/NtshVrm/VYSONM2A5-Caching.git
cd VYSONM2A5
```

2. Install dependencies:

```sh
npm install
```

## Running the Application

Start the server:

```sh
npm run build
npm run start
```

The application will be available at `http://localhost:3000`.

All requests need a "api-key" header.

Please use one o the below for sampling
Sample API Keys : 
 - "vyson" - hobby user
 - "vyson_ent" - enterprise user
 - "free_api_key" - free user

## API Endpoints

### Get All logs

```http
GET /logs
```

- Returns all stored logs.

### Get All URLs

```http
GET /list
```

- Returns all stored URLs.

### Redirect to Original URL

```http
GET /redirect?code=<short_code>&password=<password>
```

- Redirects to the original URL associated with the shortcode.
- Returns 404 if shortcode doesn't exist.
- password param is optional and only for short codes that need a password
- Requires "api-key" header.

### Shorten a URL

```http
POST /shorten
{
  "long_url": "https://example.com",
  "expiry_date": "2025-02-06T18:36:24.585Z", // optional
  "custom_code": "abc123", // optional
  "password": "securePassword" // optional
}
```

- Creates a new short code.
- Returns the generated shortcode.
- Requires "api-key" header.

### Shorten URLs in Bulk

```http
POST /shorten-bulk
{
  "long_urls": ["https://example1.com", "https://example2.com"],
  "password": "bulkPassword" // optional
}
```

- Creates multiple short URLs in one request.
- Returns an array of original URLs and their corresponding short codes.
- Requires "api-key" header.

### Update Expiry Date or Password for a Short Code

```http
PUT /code/:shortCode
{
  "expiry_date": "2025-02-06T18:36:24.585Z", // optional
  "password": "newSecurePassword" // optional
}
```

- Updates the expiry date or password for the specified short code.
- Returns the updated short code.
- Requires "api-key" header.

### Delete a Short Code

```http
DELETE /delete
{
  "short_code": "abc123"
}
```

- Deletes a shortened URL.
- Requires "api-key" header.

## Testing

Run the test suite:

```sh
npm run test
```

## Author

Nitish Varma
