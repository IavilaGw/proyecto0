package controllers

import (
	"log"
	"net/http"
	"time"

	"proyecto0-todolist/auth"

	database "proyecto0-todolist/config"
	"proyecto0-todolist/models"

	"github.com/gin-gonic/gin"
)

type CrearUsuarioDTO struct {
	Nombre       string `json:"nombre" binding:"required"`
	Contrasena   string `json:"contrasena" binding:"required"`
	ImagenPerfil string `json:"imagen_perfil"`
}

func CrearUsuario(c *gin.Context) {
	var in CrearUsuarioDTO
	if err := c.ShouldBindJSON(&in); err != nil {
		log.Printf("Error binding JSON: %v", err)
		log.Printf("Received data: %+v", c.Request.Body)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Creating user with: %+v", in)

	hashedPW, err := auth.HashPassword(in.Contrasena)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error al procesar la contraseña"})
		return
	}

	log.Printf("Password hashed successfully. Original length: %d, Hashed length: %d", len(in.Contrasena), len(hashedPW))

	if in.ImagenPerfil == "" {
		in.ImagenPerfil = "https://icons-for-free.com/iff/png/512/avatar+person+profile+user+icon-1320166578424287581.png"
	}

	u := models.Usuario{Nombre: in.Nombre, Contrasena: hashedPW, ImagenPerfil: in.ImagenPerfil}
	log.Printf("About to create user with hashed password: %s", hashedPW[:20]+"...")

	if err := database.DB.Create(&u).Error; err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "no se pudo crear el usuario"})
		return
	}

	log.Printf("User created successfully with ID: %d", u.ID)

	// No devolver la contraseña en la respuesta
	u.Contrasena = ""
	c.JSON(http.StatusCreated, u)
}

type IniciarSesionDTO struct {
	Nombre     string `json:"nombre" binding:"required"`
	Contrasena string `json:"contrasena" binding:"required"`
}

func IniciarSesion(c *gin.Context) {
	var in IniciarSesionDTO
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Login attempt for user: %s", in.Nombre)

	var u models.Usuario
	if err := database.DB.Where("nombre = ?", in.Nombre).First(&u).Error; err != nil {
		log.Printf("User not found: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciales inválidas"})
		return
	}

	if !auth.CheckPassword(in.Contrasena, u.Contrasena) {
		log.Printf("Password check failed for user: %s", in.Nombre)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "credenciales inválidas"})
		return
	}

	log.Printf("Password check successful for user: %s", in.Nombre)

	tok, err := auth.GenerateToken(u.ID, u.Nombre, 24*time.Hour)
	if err != nil {
		log.Printf("Token generation error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo generar token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": tok})
}
