package handlers

import (
	"context"
	"finance-tracker/config"
	"finance-tracker/utils"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CategorySpending struct {
	CategoryID   int     `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Amount       float64 `json:"amount"`
}

type InsightResponse struct {
	CurrentMonthTotal  float64            `json:"current_month_total"`
	PrevMonthTotal     float64            `json:"prev_month_total"`
	TotalTrend         float64            `json:"total_trend"` // Percentage change
	TopIncreasingCats  []CategoryInsight  `json:"top_increasing_categories"`
	Advice             []string           `json:"advice"`
}

type CategoryInsight struct {
	CategoryName string  `json:"category_name"`
	Amount       float64 `json:"amount"`
	IncreasePct  float64 `json:"increase_percentage"`
}

func GetFinancialInsights(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		return
	}

	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	prevMonthDate := now.AddDate(0, -1, 0)
	prevMonth := int(prevMonthDate.Month())
	prevYear := prevMonthDate.Year()

	// 1. Get totals
	curTotal := getMonthTotalExpense(userID, currentMonth, currentYear)
	prevTotal := getMonthTotalExpense(userID, prevMonth, prevYear)

	trend := 0.0
	if prevTotal > 0 {
		trend = ((curTotal - prevTotal) / prevTotal) * 100
	}

	// 2. Get category breakdown
	curCats := getCategorySpending(userID, currentMonth, currentYear)
	prevCats := getCategorySpending(userID, prevMonth, prevYear)

	// 3. Analyze categories
	var spikes []CategoryInsight
	for catID, curAmt := range curCats {
		if prevAmt, ok := prevCats[catID]; ok && prevAmt.Amount > 0 {
			increase := ((curAmt.Amount - prevAmt.Amount) / prevAmt.Amount) * 100
			if increase > 10 {
				spikes = append(spikes, CategoryInsight{
					CategoryName: curAmt.CategoryName,
					Amount:       curAmt.Amount,
					IncreasePct:  increase,
				})
			}
		} else if curAmt.Amount > 50000 { // New category with substantial spent
			spikes = append(spikes, CategoryInsight{
				CategoryName: curAmt.CategoryName,
				Amount:       curAmt.Amount,
				IncreasePct:  100, // New spending
			})
		}
	}

	// 4. Generate Advice
	var advice []string
	if trend > 15 {
		advice = append(advice, fmt.Sprintf("Waduh, pengeluaran lo bulan ini naik drastis %.1f%% dibanding bulan lalu. Coba cek lagi pos mana yang bocor, dude!", trend))
	} else if trend < -10 {
		advice = append(advice, fmt.Sprintf("Mantap! Lo berhasil nurunin pengeluaran %.1f%% dibanding bulan lalu. Pertahanin terus!", -trend))
	} else if curTotal > 0 {
		advice = append(advice, "Pengeluaran lo bulan ini cukup stabil. Tetap jaga cashflow ya!")
	}

	for _, s := range spikes {
		if s.IncreasePct >= 100 {
			advice = append(advice, fmt.Sprintf("Ada pengeluaran baru di kategori **%s** sebesar Rp %s. Pastiin ini emang perlu ya!", s.CategoryName, utils.FormatMoney(s.Amount)))
		} else if s.IncreasePct > 20 {
			advice = append(advice, fmt.Sprintf("Hati-hati, dude! Pengeluaran di **%s** naik %.1f%%. Mungkin bisa dikurangin dikit?", s.CategoryName, s.IncreasePct))
		}
	}

	if curTotal == 0 {
		advice = []string{"Belum ada data pengeluaran bulan ini. Mulai catat transaksi lo biar gue bisa kasih saran pintar!"}
	}

	c.JSON(http.StatusOK, InsightResponse{
		CurrentMonthTotal: curTotal,
		PrevMonthTotal:    prevTotal,
		TotalTrend:         trend,
		TopIncreasingCats:  spikes,
		Advice:             advice,
	})
}

func getMonthTotalExpense(userID, month, year int) float64 {
	var total float64
	query := `SELECT COALESCE(SUM(amount), 0) FROM transactions 
	          WHERE user_id = $1 AND type = 'expense' 
	          AND EXTRACT(MONTH FROM transaction_date) = $2 
	          AND EXTRACT(YEAR FROM transaction_date) = $3`
	config.DB.QueryRow(context.Background(), query, userID, month, year).Scan(&total)
	return total
}

func getCategorySpending(userID, month, year int) map[int]CategorySpending {
	result := make(map[int]CategorySpending)
	query := `SELECT c.id, c.name, COALESCE(SUM(t.amount), 0) 
	          FROM categories c
	          LEFT JOIN transactions t ON t.category_id = c.id 
	          WHERE c.user_id = $1 AND c.type = 'expense'
	          AND EXTRACT(MONTH FROM t.transaction_date) = $2 
	          AND EXTRACT(YEAR FROM t.transaction_date) = $3
	          GROUP BY c.id, c.name`
	
	rows, err := config.DB.Query(context.Background(), query, userID, month, year)
	if err != nil {
		return result
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var name string
		var amount float64
		if err := rows.Scan(&id, &name, &amount); err == nil && amount > 0 {
			result[id] = CategorySpending{CategoryID: id, CategoryName: name, Amount: amount}
		}
	}
	return result
}
