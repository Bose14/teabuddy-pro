import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";

export type MonthFilterPeriod = "thisMonth" | "custom" | "allTime";

interface MonthYearFilterProps {
  onFilterChange: (startDate: string | null, endDate: string | null) => void;
}

export function MonthYearFilter({ onFilterChange }: MonthYearFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<MonthFilterPeriod>("thisMonth");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate years from 2020 to current year + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  useEffect(() => {
    calculateDates();
  }, [selectedPeriod, selectedMonth, selectedYear]);

  const calculateDates = () => {
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (selectedPeriod) {
      case "thisMonth":
        const today = new Date();
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        endDate = format(endOfMonth(today), "yyyy-MM-dd");
        break;

      case "custom":
        const customDate = new Date(selectedYear, selectedMonth, 1);
        startDate = format(startOfMonth(customDate), "yyyy-MM-dd");
        endDate = format(endOfMonth(customDate), "yyyy-MM-dd");
        break;

      case "allTime":
        startDate = null;
        endDate = null;
        break;
    }

    onFilterChange(startDate, endDate);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Select
        value={selectedPeriod}
        onValueChange={(value) => setSelectedPeriod(value as MonthFilterPeriod)}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="thisMonth">📈 This Month</SelectItem>
          <SelectItem value="custom">🗓️ Select Month</SelectItem>
          <SelectItem value="allTime">🌍 All Time</SelectItem>
        </SelectContent>
      </Select>

      {selectedPeriod === "custom" && (
        <>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}
