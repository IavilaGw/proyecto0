# ====== Etapa de build ======
FROM golang:1.24.6-alpine AS builder   
WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

ENV GOTOOLCHAIN=auto

# Dependencias (cache-friendly)
COPY go.mod go.sum ./
RUN go mod download

# Código fuente
COPY . .

# Compila el binario (tu main está en cmd/)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/main.go

# ====== Etapa runtime ======
FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /app/main .
ENV PORT=8080
EXPOSE 8080
CMD ["./main"]

