package handlers

import (
	"context"
	"finance-tracker/config"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CategoryInput struct {
	Name string `json:"name"`
	Type string `json:"type"` // income / expense
}

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// CREATE CATEGORY
func CreateCategory(c *gin.Context) {

	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userID := userIDInterface.(int)

	var input CategoryInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid input",
		})
		return
	}

	if input.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Category name cannot be empty",
		})
		return
	}

	if input.Type != "income" && input.Type != "expense" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Type must be income or expense",
		})
		return
	}

	var catID int

	err := config.DB.QueryRow(
		context.Background(),
		`INSERT INTO categories (user_id, name, type)
		 VALUES ($1,$2,$3)
		 RETURNING id`,
		userID,
		input.Name,
		input.Type,
	).Scan(&catID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Category creation failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Category created",
		"id":      catID,
	})
}

// GET CATEGORIES
func GetCategories(c *gin.Context) {

	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found in context",
		})
		return
	}

	userID := userIDInterface.(int)

	rows, err := config.DB.Query(
		context.Background(),
		`SELECT id, name, type
		 FROM categories
		 WHERE user_id=$1
		 ORDER BY id`,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch categories",
		})
		return
	}

	defer rows.Close()

	var categories []Category

	for rows.Next() {

		var cat Category

		err := rows.Scan(
			&cat.ID,
			&cat.Name,
			&cat.Type,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read category data",
			})
			return
		}

		categories = append(categories, cat)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Row iteration error",
		})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// UPDATE CATEGORY
func UpdateCategory(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	userID := userIDInterface.(int)

	id := c.Param("id")

	var input CategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if input.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category name cannot be empty"})
		return
	}

	if input.Type != "income" && input.Type != "expense" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type must be income or expense"})
		return
	}

	res, err := config.DB.Exec(
		context.Background(),
		`UPDATE categories SET name=$1, type=$2 WHERE id=$3 AND user_id=$4`,
		input.Name,
		input.Type,
		id,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category updated"})
}

// DELETE CATEGORY
func DeleteCategory(c *gin.Context) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	userID := userIDInterface.(int)

	id := c.Param("id")

	// Start a transaction to ensure everything is deleted or nothing is
	tx, err := config.DB.Begin(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback(context.Background())

	// 1. Delete associated transactions
	_, err = tx.Exec(context.Background(), `DELETE FROM transactions WHERE category_id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete associated transactions: " + err.Error()})
		return
	}

	// 2. Delete associated budgets
	_, err = tx.Exec(context.Background(), `DELETE FROM budgets WHERE category_id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete associated budgets: " + err.Error()})
		return
	}

	// 3. Delete associated recurring transactions
	_, err = tx.Exec(context.Background(), `DELETE FROM recurring_transactions WHERE category_id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete associated recurring transactions: " + err.Error()})
		return
	}

	// 4. Delete the category itself
	res, err := tx.Exec(context.Background(), `DELETE FROM categories WHERE id=$1 AND user_id=$2`, id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found or access denied"})
		return
	}

	// Commit the transaction
	err = tx.Commit(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category and all associated data deleted successfully"})
}