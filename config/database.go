package database

import (
	"log"
	"os"

	"github.com/IavilaGw/proyecto0/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		// Localhost
		dsn = "postgres://proyecto0:proyecto0@localhost:5432/proyecto0?sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Error al conectar a la base de datos:", err)
	}

	log.Println("Conexión exitosa a la base de datos")

	err = DB.AutoMigrate(&models.Usuario{}, &models.Categoria{}, &models.Tarea{})
	if err != nil {
		log.Fatal(" Error en migraciones:", err)
	}
	log.Println("Migraciones aplicadas correctamente")
}
