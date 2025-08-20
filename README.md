# Proyecto0 - TodoList API

A full-stack TodoList application built with Go (Gin framework) and a modern web frontend, containerized with Docker.

## 🏗️ Architecture

- **Backend**: Go API with Gin framework, GORM ORM, and PostgreSQL
- **Frontend**: HTML/CSS/JavaScript with Nginx reverse proxy
- **Database**: PostgreSQL 16
- **Authentication**: JWT-based authentication
- **Containerization**: Docker with docker-compose

## 🚀 Quick Start with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

### Running the Project

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd proyecto0
   ```

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
- **Database**: localhost:5433 (PostgreSQL)

### Default Credentials

- **Database**:
  - Host: `localhost` (or `db` from within containers)
  - Port: `5433`
  - Database: `proyecto0`
  - Username: `username`
  - Password: `password`

- **JWT Secret**: `equipo-pregrado`

## 🛠️ Development

### Rebuilding Services

If you make changes to the code, rebuild the services:

```bash
# Rebuild and restart all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build api
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v
```

### Database Management

```bash
# Access PostgreSQL container
docker exec -it proyecto0-db psql -U username -d proyecto0

# View database logs
docker-compose logs db

# Reset database (⚠️ This will delete all data)
docker-compose down -v
docker-compose up -d
```

## 📁 Project Structure

```
proyecto0/
├── auth/                 # Authentication utilities
├── cmd/                  # Main application entry point
├── config/               # Database configuration
├── controllers/          # HTTP request handlers
├── middleware/           # HTTP middleware (auth, etc.)
├── models/               # Data models
├── routes/               # API route definitions
├── frontend/             # Web frontend files
├── Dockerfile            # Go API container
├── docker-compose.yml    # Multi-service orchestration
└── go.mod               # Go dependencies
```

## 🔧 Configuration

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

### Customizing Ports

To change the default ports, you can:

1. **Set environment variable**:
   ```bash
   PORT=3000 docker-compose up -d
   ```

2. **Modify docker-compose.yml**:
   ```yaml
   ports:
     - "3000:8080"  # Change 3000 to your preferred port
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :80
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **Database connection issues**
   ```bash
   # Check if database is running
   docker-compose ps db
   
   # Check database logs
   docker-compose logs db
   ```

3. **Build failures**
   ```bash
   # Clean up and rebuild
   docker-compose down
   docker system prune -f
   docker-compose up -d --build
   ```

### Logs and Debugging

```bash
# Follow logs in real-time
docker-compose logs -f

# Check container status
docker-compose ps

# Access running container
docker exec -it proyecto0-api sh
docker exec -it proyecto0-db psql -U username -d proyecto0
```

## 📚 API Documentation

The API documentation is available in the `docs/` folder as a Postman collection:
- `docs/Proyecto0-APi.postman_collection.json`

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
