"use client"
import dayjs from "dayjs"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"

export default function Calendar({
  label,
  value,
  onChange,
  maxDate = null,
  minDate = null,
  disabled = false,
  required = false,
  className = "",
}) {
  // Convert string date to dayjs object if it exists
  const dateValue = value ? dayjs(value) : null

  // Get current year for default view
  const currentYear = dayjs().year()

  // Handle date change and convert to ISO string format
  const handleDateChange = (newDate) => {
    if (newDate) {
      onChange(newDate.format("YYYY-MM-DD"))
    } else {
      onChange("")
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={dateValue}
        onChange={handleDateChange}
        // Use provided maxDate/minDate or use defaults for year range
        maxDate={maxDate ? dayjs(maxDate) : dayjs().add(10, "year")}
        minDate={minDate ? dayjs(minDate) : dayjs().subtract(100, "year")}
        openTo="day"
        views={["year", "month", "day"]}
        yearsPerRow={3}
        // Display current year at the top
        defaultCalendarMonth={dayjs(`${currentYear}-01-01`)}
        disabled={disabled}
        slotProps={{
          textField: {
            required: required,
            fullWidth: true,
            size: "large",
            className: className,
            sx: {
              "& .MuiOutlinedInput-root": {
                height: "42px", // Match the height of the address input
                padding: "0px",
              },
              "& .MuiInputLabel-root": {
                transform: "translate(14px, 12px) scale(1)",
              },
              "& .MuiInputLabel-shrink": {
                transform: "translate(14px, -9px) scale(0.75)",
              },
              // Adjust the calendar icon position - moved further right
              "& .MuiInputAdornment-root": {
                marginRight: "14px",
                position: "absolute",
                right: "0",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "20px",
              },
              // Hide the calendar icon when the field is disabled
              "& .Mui-disabled .MuiInputAdornment-root": {
                display: "none",
              },
            },
          },
          // Configure the year selection view to start from current year
          desktopPaper: {
            sx: {
              "& .MuiPickersYear-yearButton": {
                fontSize: "0.875rem",
              },
            },
          },
        }}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-root": {
            height: "42px", // Match the height of the address input
            "&:hover fieldset": {
              borderColor: "#5C7346",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#5C7346",
              borderWidth: "2px",
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#5C7346",
          },
        }}
      />
    </LocalizationProvider>
  )
}

