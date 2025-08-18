package main

import (
	database "github.com/IavilaGw/proyecto0/config"
	"github.com/IavilaGw/proyecto0/models"
	"github.com/IavilaGw/proyecto0/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()
	database.DB.AutoMigrate(&models.Usuario{}, &models.Categoria{}, &models.Tarea{})

	r := gin.Default()

	r.GET("/", func(c *gin.Context){ c.String(200, "API OK") })
r.GET("/api/v1/health", func(c *gin.Context){ c.String(200, "ok") })

	routes.Register(r)

	r.Run(":8080")
}
