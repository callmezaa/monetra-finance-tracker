package models

type User struct {
	ID                 int    `json:"id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	PasswordHash       string `json:"-"`
	ProfilePicture     string `json:"profile_picture"`
	EmailNotifications bool   `json:"email_notifications"`
	MonthlyReports     bool   `json:"monthly_reports"`
}