# Proyecto0 - TaskMaster

A TodoList application built with Go (Gin framework) and a modern web frontend, containerized with Docker.
VIDEO DEMO: https://youtu.be/GyCNcmRjayk

# Team

### Ivan Avila - 202216280
### Raul Insuasty - 202015512
### Ana María Sánchez Mejía - 202013587
### David Tobón Molina - 202123804

# Demonstration Video

## Tech Stack

- **Backend**: Go API with Gin framework, GORM ORM, and PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Database**: PostgreSQL 16
- **Authentication**: JWT-based authentication
- **Containerization**: Docker with docker-compose

## Quickstart

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

### Running the Project

1. **Clone the repository**
   ```bash
   git clone https://github.com/IavilaGw/proyecto0.git
   cd proyecto0
   ```

   Or download the source code in a _.zip_ file.

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This command will:
   - Build and start the Go API service
   - Start PostgreSQL database
   - Build and start the frontend with Nginx
   - Create necessary networks and volumes

3. **Check service status**
   ```bash
   docker-compose ps
   ```

4. **View logs (optional)**
   ```bash
   # View all services logs
   docker-compose logs -f
   
   # View specific service logs
   docker-compose logs -f api
   docker-compose logs -f db
   docker-compose logs -f frontend
   ```

### Accessing the Application

- **Frontend**: http://localhost:80
- **API**: http://localhost:8080

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (This will delete all data)
docker-compose down -v
```

## Configuration

### Environment Variables

The application uses the following environment variables (configured in docker-compose.yml):

- `DB_HOST`: Database host (default: `db`)
- `DB_PORT`: Database port (default: `5432`)
- `DB_USER`: Database username (default: `username`)
- `DB_PASSWORD`: Database password (default: `password`)
- `DB_NAME`: Database name (default: `proyecto0`)
- `DB_SSL_MODE`: Database SSL mode (default: `disable`)
- `SERVER_PORT`: API server port (default: `8080`)
- `JWT_SECRET`: JWT signing secret (default: `equipo-pregrado`)
- `ENV`: Environment (default: `production`)

## API Documentation with Postman

The API documentation is available in the `docs/` folder as a Postman collection:
- `docs/Proyecto0-APi.postman_collection.json`

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
