package database

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	// Lee DATABASE_URL del entorno (docker-compose la define)
	dsn := os.Getenv("DATABASE_URL")

	// Fallback para cuando corres la app fuera de Docker
	if dsn == "" {
		// Localhost (útil si corres `go run main.go` sin docker)
		dsn = "postgres://proyecto0:proyecto0@localhost:5432/proyecto0?sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Error al conectar a la base de datos:", err)
	}

	log.Println("✅ Conexión exitosa a la base de datos")
}
