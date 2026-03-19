package utils

import "fmt"

func FormatMoney(n float64) string {
	s := fmt.Sprintf("%.0f", n)
	if len(s) <= 3 {
		return s
	}
	var res string
	for i, char := range s {
		if (len(s)-i)%3 == 0 && i != 0 {
			res += "."
		}
		res += string(char)
	}
	return res
}
