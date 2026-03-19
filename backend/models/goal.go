package models

import "time"

type Goal struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	Name          string    `json:"name"`
	TargetAmount  float64   `json:"target_amount"`
	CurrentAmount float64    `json:"current_amount"`
	Deadline      *time.Time `json:"deadline,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type GoalInput struct {
	Name         string  `json:"name" binding:"required"`
	TargetAmount float64 `json:"target_amount" binding:"required,gt=0"`
	Deadline     *string `json:"deadline"`
}

type GoalAddSavingInput struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}
