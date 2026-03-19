package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", dbUser, dbPass, dbHost, dbPort, dbName)
	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close(context.Background())

	query := `
	CREATE TABLE IF NOT EXISTS recurring_transactions (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL,
		description VARCHAR(255) NOT NULL,
		amount DECIMAL(12,2) NOT NULL,
		category_id INTEGER NOT NULL,
		type VARCHAR(10) NOT NULL, -- income or expense
		frequency VARCHAR(20) DEFAULT 'monthly',
		day_of_month INTEGER NOT NULL,
		next_occurrence DATE NOT NULL,
		is_active BOOLEAN DEFAULT TRUE,
		auto_add BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

		CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		CONSTRAINT fk_recurring_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
	);`

	_, err = conn.Exec(context.Background(), query)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Migrated recurring_transactions table successfully!")
}
