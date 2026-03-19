package models

import "time"

type RecurringTransaction struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	Description    string    `json:"description"`
	Amount         float64   `json:"amount"`
	CategoryID     int       `json:"category_id"`
	CategoryName   string    `json:"category_name,omitempty"`
	Type           string    `json:"type"` // income / expense
	Frequency      string    `json:"frequency"` // monthly, weekly, yearly
	DayOfMonth     int       `json:"day_of_month"`
	NextOccurrence time.Time `json:"next_occurrence"`
	IsActive       bool      `json:"is_active"`
	AutoAdd        bool      `json:"auto_add"`
	CreatedAt      time.Time `json:"created_at"`
}

type RecurringInput struct {
	Description    string  `json:"description" binding:"required"`
	Amount         float64 `json:"amount" binding:"required"`
	CategoryID     int     `json:"category_id" binding:"required"`
	Type           string  `json:"type" binding:"required"`
	Frequency      string  `json:"frequency" binding:"required"`
	DayOfMonth     int     `json:"day_of_month" binding:"required"`
	AutoAdd        bool    `json:"auto_add"`
}
