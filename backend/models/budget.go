package models

import "time"

type Budget struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	CategoryID   int       `json:"category_id"`
	CategoryName string    `json:"category_name,omitempty"` // From Join
	Amount       float64   `json:"amount"` // Budget Limit
	Spent        float64   `json:"spent"`  // Calculated from transactions
	Month        int       `json:"month"`
	Year         int       `json:"year"`
	CreatedAt    time.Time `json:"created_at"`
}

type BudgetInput struct {
	CategoryID int     `json:"category_id"`
	Amount     float64 `json:"amount"` // Budget Limit
	Month      int     `json:"month"`
	Year       int     `json:"year"`
}
