package model

import "testing"

func TestComputeIncomeBadge(t *testing.T) {
	tests := []struct {
		name      string
		total     int
		level     int
		current   int
		next      int
		remaining int
		percent   int
	}{
		{"empty month", 0, 0, 0, 1000, 1000, 0},
		{"mid first thousand", 400, 0, 0, 1000, 600, 40},
		{"exactly first badge", 1000, 1, 1000, 3000, 2000, 0},
		{"mid toward 3000", 2000, 1, 1000, 3000, 1000, 50},
		{"exactly 3000", 3000, 2, 3000, 6000, 3000, 0},
		{"mid toward 6000", 5400, 2, 3000, 6000, 600, 80},
		{"exactly 6000", 6000, 3, 6000, 9000, 3000, 0},
		{"scaled mid ladder", 21000, 6, 18000, 24000, 3000, 50},
		{"around 100k", 105300, 13, 102000, 120000, 14700, 18},
		{"late ladder start", 180000, 16, 180000, 210000, 30000, 0},
		{"late ladder mid", 195000, 16, 180000, 210000, 15000, 50},
		{"negative clamps to zero", -100, 0, 0, 1000, 1000, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := ComputeIncomeBadge("2026-09", tc.total)
			if got.Month != "2026-09" {
				t.Fatalf("month = %q", got.Month)
			}
			if got.Step != tc.next-tc.current {
				t.Fatalf("step = %d", got.Step)
			}
			wantTotal := tc.total
			if wantTotal < 0 {
				wantTotal = 0
			}
			if got.Total != wantTotal || got.Level != tc.level ||
				got.CurrentThreshold != tc.current || got.NextThreshold != tc.next ||
				got.Remaining != tc.remaining || got.Percent != tc.percent {
				t.Fatalf("got %+v", got)
			}
		})
	}
}
