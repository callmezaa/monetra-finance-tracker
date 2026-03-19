package models

import "time"

type Transaction struct {
	ID              int       `json:"id"`
	UserID          int       `json:"user_id"`
	CategoryID      int       `json:"category_id"`
	Amount          float64   `json:"amount"`
	Type            string    `json:"type"` // income / expense
	Description     string    `json:"description"`
	TransactionDate time.Time `json:"transaction_date"`
	CreatedAt       time.Time `json:"created_at"`
}