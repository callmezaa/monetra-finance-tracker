package routes

import (
	"finance-tracker/handlers"
	"finance-tracker/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	api := r.Group("/api")

	// public routes
	api.POST("/register", handlers.Register)
	api.POST("/login", handlers.Login)
	api.POST("/auth/google", handlers.GoogleLogin)

	// protected routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())

	{
		// transactions
		protected.POST("/transactions", handlers.CreateTransaction)
		protected.GET("/transactions", handlers.GetTransactions)
		protected.DELETE("/transactions/:id", handlers.DeleteTransaction)

		// categories
		protected.POST("/categories", handlers.CreateCategory)
		protected.GET("/categories", handlers.GetCategories)
		protected.PUT("/categories/:id", handlers.UpdateCategory)
		protected.DELETE("/categories/:id", handlers.DeleteCategory)

		// budgets
		protected.POST("/budgets", handlers.CreateBudget)
		protected.GET("/budgets", handlers.GetBudgets)
		protected.DELETE("/budgets/:id", handlers.DeleteBudget)

		// goals
		protected.POST("/goals", handlers.CreateGoal)
		protected.GET("/goals", handlers.GetGoals)
		protected.PUT("/goals/:id/add", handlers.AddSavingToGoal)
		protected.DELETE("/goals/:id", handlers.DeleteGoal)

		// user profile
		protected.GET("/user/profile", handlers.GetProfile)
		protected.PUT("/user/profile", handlers.UpdateProfile)
		protected.PUT("/user/password", handlers.ChangePassword)
		protected.POST("/user/upload-avatar", handlers.UploadProfilePicture)

		// Static files
		r.Static("/uploads", "./uploads")

		// dashboard summary
		protected.GET("/dashboard", handlers.Dashboard)

		// reports
		protected.GET("/reports/monthly", handlers.GetMonthlyReport)
		protected.GET("/reports/by-category", handlers.GetByCategory)
		protected.GET("/reports/summary", handlers.GetYearSummary)
		protected.GET("/reports/export/csv", handlers.ExportCSV)
		protected.GET("/reports/export/pdf", handlers.ExportPDF)

		// notifications
		protected.GET("/notifications", handlers.GetNotifications)
		protected.PUT("/notifications/:id/read", handlers.MarkNotificationAsRead)
		protected.PUT("/notifications/read-all", handlers.MarkAllNotificationsAsRead)

		// recurring transactions
		protected.GET("/recurring", handlers.GetRecurringTransactions)
		protected.POST("/recurring", handlers.CreateRecurringTransaction)
		protected.PUT("/recurring/:id/toggle", handlers.ToggleRecurringTransaction)
		protected.DELETE("/recurring/:id", handlers.DeleteRecurringTransaction)
		protected.POST("/recurring/process", handlers.ProcessRecurringCheck)

		// insights
		protected.GET("/insights", handlers.GetFinancialInsights)
	}
}