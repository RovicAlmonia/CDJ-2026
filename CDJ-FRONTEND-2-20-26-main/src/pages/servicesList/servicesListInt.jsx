import React, { useState, useContext, useMemo } from "react";
import {
  Box, Button, TextField, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
  InputAdornment, Chip, useTheme, TablePagination, alpha, Dialog,
  DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, Divider, Grid, Collapse,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { hookContainer } from "../../hooks/globalQuery";
import { useQueryClient } from "@tanstack/react-query";
import { http } from "../../api/http";
import { toast } from "sonner";
import { AuthContext } from "../../modules/context/AuthContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

function monthsToLabel(totalMonths) {
  if (!totalMonths && totalMonths !== 0) return "—";
  const m = parseInt(totalMonths);
  if (m < 12) return `${m} month${m !== 1 ? "s" : ""}`;
  const years = Math.floor(m / 12);
  const months = m % 12;
  if (months === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years} yr${years !== 1 ? "s" : ""} ${months} mo${months !== 1 ? "s" : ""}`;
}

function RenewalChip({ totalMonths }) {
  if (!totalMonths && totalMonths !== 0)
    return <Typography variant="caption" sx={{ color: "text.disabled" }}>—</Typography>;
  const m = parseInt(totalMonths);
  const color = m <= 3 ? "error" : m <= 12 ? "warning" : m <= 36 ? "info" : "success";
  return (
    <Chip
      icon={<AutorenewIcon sx={{ fontSize: "0.75rem !important" }} />}
      label={monthsToLabel(m)}
      size="small"
      color={color}
      variant="outlined"
      sx={{ fontSize: "0.7rem", height: 20 }}
    />
  );
}

const fmtMoney = (val) =>
  "₱" + Number(val || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const RENEWAL_PRESETS = [
  { label: "1 Month",  totalMonths: 1  },
  { label: "3 Months", totalMonths: 3  },
  { label: "6 Months", totalMonths: 6  },
  { label: "1 Year",   totalMonths: 12 },
  { label: "2 Years",  totalMonths: 24 },
  { label: "3 Years",  totalMonths: 36 },
  { label: "5 Years",  totalMonths: 60 },
  { label: "6 Years",  totalMonths: 72 },
];

const RENEWAL_FILTER_OPTIONS = [
  { label: "All",        value: "All" },
  { label: "≤ 3 mo",    value: "short",  max: 3  },
  { label: "≤ 1 yr",    value: "medium", max: 12 },
  { label: "≤ 3 yrs",   value: "long",   max: 36 },
  { label: "> 3 yrs",   value: "xlong"           },
];

const emptyForm = {
  id: "", serviceid: "", servicename: "", servicerate: "",
  servicerenewalmonths: 12, manualValue: "1", manualUnit: "years",
};

// ── Shared Styles ─────────────────────────────────────────────────────────────

function makeStyles(darkMode) {
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: darkMode ? "#161C24" : "#EAECEE",
      "& fieldset": { borderColor: darkMode ? "rgb(118, 118, 118)" : "rgba(0,0,0,0.12)" },
      "&:hover fieldset": { borderColor: darkMode ? "#161C24" : "rgba(0,0,0,0.12)" },
      "&.Mui-focused fieldset": { borderColor: darkMode ? "#42a5f5" : "#1976d2" },
    },
  };
  const paperSx = {
    border: `1px solid ${darkMode ? "rgba(145,158,171,0.12)" : "#c7c7c7"}`,
    backgroundColor: darkMode ? "#161C24" : "#EAECEE",
    borderRadius: 2, overflow: "hidden",
  };
  const dialogPaperSx = {
    borderRadius: 2,
    backgroundColor: darkMode ? "#161C24" : "#EAECEE",
  };
  return { inputSx, paperSx, dialogPaperSx };
}

// ── Expandable Client Usage Row (inside ServiceInfoDialog) ────────────────────

function ClientUsageRow({ row, theme }) {
  const [expanded, setExpanded] = useState(false);
  const darkMode = theme.palette.mode === "dark";
  const cellSx = { fontSize: "0.80rem", px: 1.5, py: 0.8, borderBottom: "1px solid", borderColor: "divider" };

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: "pointer", backgroundColor: expanded ? alpha(theme.palette.primary.main, darkMode ? 0.12 : 0.05) : "transparent" }}
        onClick={() => setExpanded(p => !p)}
      >
        <TableCell sx={{ ...cellSx, width: 40 }}>
          <IconButton size="small" sx={{ p: 0 }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{row.ClientID || "—"}</TableCell>
        <TableCell sx={cellSx}>{row.TradeName || row.ClientName || "—"}</TableCell>
        <TableCell sx={cellSx}>{row.TransactionDate ? dayjs(row.TransactionDate).format("MMM D, YYYY") : "—"}</TableCell>
        <TableCell sx={{ ...cellSx, fontWeight: 600, color: "success.main" }}>{fmtMoney(row.Amount ?? row.NetTotal)}</TableCell>
        <TableCell sx={cellSx}>
          <Chip
            label={row.Status || "—"} size="small"
            color={row.Status === "Paid" ? "success" : row.Status === "Posted" ? "warning" : "primary"}
            sx={{ fontSize: "0.7rem" }}
          />
        </TableCell>
        <TableCell sx={cellSx}>{row.PreparedBy || "—"}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{
              backgroundColor: alpha(theme.palette.info.main, darkMode ? 0.08 : 0.04),
              px: 4, py: 1.5,
            }}>
              <Typography variant="caption" fontWeight="bold" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1, display: "block" }}>
                Transaction Detail
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: "Billing ID",    value: row.BillingID ?? row.IDTransaction ?? "—" },
                  { label: "Particulars",   value: row.Particulars || "—" },
                  { label: "Gross Total",   value: fmtMoney(row.GrossTotal) },
                  { label: "Discount",      value: fmtMoney(row.Discount) },
                  { label: "Service Fee",   value: fmtMoney(row.ServiceFee) },
                  { label: "Net Total",     value: fmtMoney(row.Total ?? row.NetTotal) },
                  { label: "QTY",           value: row.QTY ?? "—" },
                  { label: "Rate",          value: fmtMoney(row.Rate) },
                ].map(item => (
                  <Grid item xs={6} sm={3} key={item.label}>
                    <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.68rem" }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontSize: "0.80rem", fontWeight: 500 }}>{item.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ── Service Info Dialog (equivalent of ClientInfoDialog) ──────────────────────

function ServiceInfoDialog({ open, onClose, service, theme }) {
  const serviceId = service?.ServiceID ?? "";
  const { data: usageRaw } = hookContainer(
    serviceId ? `/selectserviceusage?serviceid=${serviceId}` : `/selectserviceusage?serviceid=__none__`
  );
  const usageRows = Array.isArray(usageRaw?.data) ? usageRaw.data : [];
  const darkMode = theme.palette.mode === "dark";
  const { dialogPaperSx } = makeStyles(darkMode);

  const currentYear  = useMemo(() => dayjs().year().toString(), []);
  const currentMonth = useMemo(() => dayjs().month() + 1, []);
  const [selYear,  setSelYear]  = useState(currentYear);
  const [selMonth, setSelMonth] = useState(currentMonth);

  React.useEffect(() => {
    if (open) { setSelYear(currentYear); setSelMonth(currentMonth); }
  }, [open, serviceId]); // eslint-disable-line

  if (!service) return null;

  const headerSx = {
    fontWeight: "bold", fontSize: "0.75rem", whiteSpace: "nowrap",
    px: 1.5, py: 1, backgroundColor: "action.hover", color: "text.secondary",
    textTransform: "uppercase", letterSpacing: "0.05em",
    borderBottom: "2px solid", borderColor: "divider", position: "sticky", top: 0, zIndex: 1,
  };

  const availableYears = [...new Set(
    usageRows.map(r => r.TransactionDate ? dayjs(r.TransactionDate).format("YYYY") : null).filter(Boolean)
  )].sort((a, b) => b - a);

  const yearFiltered = usageRows.filter(r => {
    const rowYear = r.TransactionDate ? dayjs(r.TransactionDate).format("YYYY") : null;
    return rowYear === selYear;
  });

  const availableMonths = [...new Set(
    yearFiltered.map(r => r.TransactionDate ? dayjs(r.TransactionDate).month() + 1 : null).filter(Boolean)
  )].sort((a, b) => a - b);

  const displayRows = selMonth === null
    ? yearFiltered
    : yearFiltered.filter(r => r.TransactionDate ? dayjs(r.TransactionDate).month() + 1 === selMonth : false);

  const totalRevenue = displayRows.reduce((s, r) => s + Number(r.Amount ?? r.NetTotal ?? 0), 0);
  const uniqueClients = [...new Set(displayRows.map(r => r.ClientID).filter(Boolean))].length;

  const infoItems = [
    { label: "Service ID",      value: service.ServiceID },
    { label: "Rate",            value: service.ServiceRate != null ? fmtMoney(service.ServiceRate) : "—" },
    { label: "Renewal Period",  value: monthsToLabel(service.ServiceRenewalMonths) },
    { label: "Renewal (months)", value: service.ServiceRenewalMonths ? `${service.ServiceRenewalMonths} month${service.ServiceRenewalMonths !== 1 ? "s" : ""}` : "—" },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper"
      PaperProps={{ sx: { ...dialogPaperSx, maxHeight: "92vh" } }}>

      <DialogTitle sx={{ p: 0, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{
          px: 3, py: 2,
          background: darkMode
            ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.25)}, ${alpha(theme.palette.primary.main, 0.15)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.10)}, ${alpha(theme.palette.primary.main, 0.06)})`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: alpha(theme.palette.info.main, 0.15), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MiscellaneousServicesIcon sx={{ color: "info.main" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>{service.ServiceName || "—"}</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Service ID: {service.ServiceID || "—"}</Typography>
              <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                <RenewalChip totalMonths={service.ServiceRenewalMonths} />
                {service.ServiceRate != null && (
                  <Chip label={fmtMoney(service.ServiceRate)} size="small" color="success" sx={{ fontSize: "0.7rem", height: 18, fontFamily: "monospace" }} />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Service Details */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="caption" fontWeight="bold" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5, display: "block" }}>
            Service Information
          </Typography>
          <Grid container spacing={1.5}>
            {infoItems.map(item => item.value && item.value !== "—" ? (
              <Grid item xs={6} sm={3} key={item.label}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.disabled", display: "block", fontSize: "0.68rem" }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.80rem", fontWeight: 500 }}>{item.value}</Typography>
                </Box>
              </Grid>
            ) : null)}
          </Grid>
        </Box>

        {/* Usage Section */}
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
            <CalendarMonthIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="caption" fontWeight="bold" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Client Usage History
            </Typography>
            <Chip label={`${displayRows.length} record${displayRows.length !== 1 ? "s" : ""}`}
              size="small" color="info" variant="outlined" sx={{ fontSize: "0.68rem", height: 18 }} />
            {displayRows.length > 0 && (
              <>
                <Chip
                  icon={<PeopleAltIcon sx={{ fontSize: "0.75rem !important" }} />}
                  label={`${uniqueClients} client${uniqueClients !== 1 ? "s" : ""}`}
                  size="small" color="primary" variant="outlined" sx={{ fontSize: "0.68rem", height: 18 }}
                />
                <Chip label={`Revenue: ${fmtMoney(totalRevenue)}`} size="small" color="success" sx={{ fontSize: "0.68rem", height: 18, ml: "auto" }} />
              </>
            )}
          </Box>

          {/* Year filter */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: "text.disabled", mr: 0.5, minWidth: 36 }}>Year:</Typography>
            {availableYears.length === 0
              ? <Typography variant="caption" sx={{ color: "text.disabled" }}>—</Typography>
              : availableYears.map(y => (
                <Chip key={y} label={y} size="small" clickable
                  color={selYear === y ? "info" : "default"}
                  variant={selYear === y ? "filled" : "outlined"}
                  onClick={() => { setSelYear(y); setSelMonth(null); }}
                  sx={{ fontSize: "0.70rem", height: 22 }}
                />
              ))
            }
          </Box>

          {/* Month filter */}
          {selYear && availableMonths.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: "text.disabled", mr: 0.5, minWidth: 36 }}>Month:</Typography>
              <Chip label="All" size="small" clickable
                color={selMonth === null ? "secondary" : "default"}
                variant={selMonth === null ? "filled" : "outlined"}
                onClick={() => setSelMonth(null)}
                sx={{ fontSize: "0.70rem", height: 22 }}
              />
              {availableMonths.map(m => (
                <Chip key={m} label={dayjs().month(m - 1).format("MMM")} size="small" clickable
                  color={selMonth === m ? "secondary" : "default"}
                  variant={selMonth === m ? "filled" : "outlined"}
                  onClick={() => setSelMonth(m)}
                  sx={{ fontSize: "0.70rem", height: 22 }}
                />
              ))}
            </Box>
          )}

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem", whiteSpace: "nowrap", px: 1.5, py: 1, backgroundColor: "action.hover", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid", borderColor: "divider", width: 40 }} />
                  {["Client ID", "Trade Name", "Date", "Amount", "Status", "Prepared By"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: "bold", fontSize: "0.75rem", whiteSpace: "nowrap", px: 1.5, py: 1, backgroundColor: "action.hover", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid", borderColor: "divider" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No usage records found{selYear ? ` for ${selMonth ? dayjs().month(selMonth - 1).format("MMMM") + " " : ""}${selYear}` : ""}.
                    </TableCell>
                  </TableRow>
                ) : displayRows.map((row, i) => (
                  <ClientUsageRow key={`${row.BillingID}-${i}`} row={row} theme={theme} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Add / Edit Dialog ─────────────────────────────────────────────────────────

function ServiceFormDialog({ open, onClose, onSave, form, setForm, isEdit, theme }) {
  const darkMode = theme.palette.mode === "dark";
  const { inputSx, dialogPaperSx } = makeStyles(darkMode);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePresetClick = (totalMonths) => {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const useYears = months === 0 && years >= 1;
    setForm(prev => ({
      ...prev,
      servicerenewalmonths: totalMonths,
      manualValue: useYears ? years.toString() : totalMonths.toString(),
      manualUnit: useYears ? "years" : "months",
    }));
  };

  const handleManualValueChange = (value) => {
    const num = parseInt(value) || 0;
    const total = form.manualUnit === "years" ? num * 12 : num;
    setForm(prev => ({ ...prev, manualValue: value, servicerenewalmonths: total }));
  };

  const handleManualUnitChange = (unit) => {
    const num = parseInt(form.manualValue) || 0;
    const total = unit === "years" ? num * 12 : num;
    setForm(prev => ({ ...prev, manualUnit: unit, servicerenewalmonths: total }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { ...dialogPaperSx, maxHeight: "90vh" } }}>
      <DialogTitle sx={{
        borderBottom: "1px solid", borderColor: "divider", pb: 1.5,
        backgroundColor: isEdit
          ? alpha(theme.palette.warning.main, darkMode ? 0.15 : 0.07)
          : alpha(theme.palette.primary.main, darkMode ? 0.15 : 0.07),
        display: "flex", alignItems: "center", gap: 1,
      }}>
        {isEdit
          ? <EditIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
          : <AddIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />}
        <Typography variant="subtitle1" fontWeight="bold"
          sx={{ color: isEdit ? theme.palette.warning.main : theme.palette.primary.main }}>
          {isEdit ? "Edit Service" : "Add New Service"}
        </Typography>
        {isEdit && (
          <Chip label={`Record ID: ${form.id}`} size="small" color="warning" variant="outlined"
            sx={{ ml: "auto", fontSize: "0.7rem", height: 20 }} />
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "text.secondary" }}>Basic Information</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Service ID" fullWidth size="small"
                value={form.serviceid} onChange={(e) => handleChange("serviceid", e.target.value)} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={<span>Service Name / Description <span style={{ color: "red" }}>*</span></span>}
                fullWidth size="small"
                value={form.servicename} onChange={(e) => handleChange("servicename", e.target.value)} sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Rate (₱)" fullWidth size="small" type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={form.servicerate} onChange={(e) => handleChange("servicerate", e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography variant="body2" sx={{ fontWeight: 700 }}>₱</Typography></InputAdornment> }}
                sx={inputSx}
              />
            </Grid>
          </Grid>

          <Divider />

          {/* Renewal Period */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <AutorenewIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Typography variant="subtitle2" fontWeight="bold">Renewal Period</Typography>
              {form.servicerenewalmonths > 0 && (
                <Chip label={`= ${monthsToLabel(form.servicerenewalmonths)}`} size="small" color="primary"
                  sx={{ ml: "auto", fontSize: "0.7rem", height: 20 }} />
              )}
            </Box>

            <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.75, display: "block" }}>Quick presets:</Typography>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 2 }}>
              {RENEWAL_PRESETS.map((preset) => {
                const isActive = form.servicerenewalmonths === preset.totalMonths;
                return (
                  <Chip key={preset.totalMonths} label={preset.label} size="small"
                    variant={isActive ? "filled" : "outlined"} color={isActive ? "primary" : "default"}
                    onClick={() => handlePresetClick(preset.totalMonths)}
                    sx={{ cursor: "pointer", fontSize: "0.75rem", fontWeight: isActive ? 700 : 400 }}
                  />
                );
              })}
            </Box>

            <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.75, display: "block" }}>Or enter manually:</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField size="small" type="number" inputProps={{ min: 1, step: 1 }}
                value={form.manualValue} onChange={(e) => handleManualValueChange(e.target.value)}
                placeholder="e.g. 18" sx={{ flex: 1, ...inputSx }} />
              <FormControl size="small" sx={{ minWidth: 110, ...inputSx }}>
                <Select value={form.manualUnit} onChange={(e) => handleManualUnitChange(e.target.value)}>
                  <MenuItem value="months">Months</MenuItem>
                  <MenuItem value="years">Years</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {form.servicerenewalmonths > 0 && (
              <Box sx={{
                mt: 1.5, p: 1.25, borderRadius: 1, border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.3),
                backgroundColor: alpha(theme.palette.primary.main, darkMode ? 0.08 : 0.04),
                display: "flex", alignItems: "center", gap: 1,
              }}>
                <AutorenewIcon fontSize="small" sx={{ color: "primary.main" }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Service expires{" "}
                  <strong style={{ color: theme.palette.primary.main }}>{monthsToLabel(form.servicerenewalmonths)}</strong>{" "}
                  after the client avails it ({form.servicerenewalmonths} month{form.servicerenewalmonths !== 1 ? "s" : ""} stored in DB)
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
          {isEdit ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ServicesListInt() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === "dark";
  const queryClient = useQueryClient();
  const { data: servicesRaw } = hookContainer("/selectserviceslist");
  const { accessToken } = useContext(AuthContext);
  const { inputSx, paperSx } = makeStyles(darkMode);

  const servicesList = Array.isArray(servicesRaw?.data)
    ? servicesRaw.data.map((row, index) => ({ ...row, id: row.ID || index }))
    : [];

  const [form, setForm] = useState(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [serviceInfo, setServiceInfo] = useState({ open: false, service: null });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [renewalFilter, setRenewalFilter] = useState("All");
  const [rateFrom, setRateFrom] = useState("");
  const [rateTo, setRateTo] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredList = servicesList.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (row.ServiceID?.toString() || "").toLowerCase().includes(q) ||
      (row.ServiceName || "").toLowerCase().includes(q) ||
      (row.ServiceRate?.toString() || "").includes(q) ||
      monthsToLabel(row.ServiceRenewalMonths).toLowerCase().includes(q);

    const m = parseInt(row.ServiceRenewalMonths) || 0;
    const matchesRenewal =
      renewalFilter === "All" ? true :
      renewalFilter === "short"  ? m <= 3  :
      renewalFilter === "medium" ? m <= 12 :
      renewalFilter === "long"   ? m <= 36 :
      renewalFilter === "xlong"  ? m > 36  : true;

    const rate = parseFloat(row.ServiceRate) || 0;
    const matchesRateFrom = !rateFrom || rate >= parseFloat(rateFrom);
    const matchesRateTo   = !rateTo   || rate <= parseFloat(rateTo);

    return matchesSearch && matchesRenewal && matchesRateFrom && matchesRateTo;
  });

  const hasActiveFilters = searchQuery || renewalFilter !== "All" || rateFrom || rateTo;

  const handleClearFilters = () => {
    setSearchQuery(""); setRenewalFilter("All"); setRateFrom(""); setRateTo(""); setPage(0);
  };

  const paginatedList = filteredList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleNew = () => { setForm(emptyForm); setIsEdit(false); setOpen(true); };

  const handleEdit = (row) => {
    const totalMonths = parseInt(row.ServiceRenewalMonths) || 12;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const useYears = months === 0 && years >= 1;
    setForm({
      id: row.ID, serviceid: row.ServiceID || "",
      servicename: row.ServiceName || "", servicerate: row.ServiceRate || "",
      servicerenewalmonths: totalMonths,
      manualValue: useYears ? years.toString() : totalMonths.toString(),
      manualUnit: useYears ? "years" : "months",
    });
    setIsEdit(true); setOpen(true);
  };

  const handleClose = () => { setOpen(false); setForm(emptyForm); setIsEdit(false); };

  const handleSave = async () => {
    if (!form.servicename) { toast.error("Service Name is required."); return; }
    if (!form.servicerenewalmonths || form.servicerenewalmonths < 1) {
      toast.error("Renewal period must be at least 1 month."); return;
    }
    const payload = {
      id: form.id, serviceid: form.serviceid, servicename: form.servicename,
      servicerate: parseFloat(form.servicerate) || 0,
      servicerenewalmonths: form.servicerenewalmonths,
    };
    try {
      if (isEdit) {
        await http.post("/updateserviceslist", payload);
        toast.success("Service updated successfully!");
      } else {
        await http.post("/postserviceslist", payload);
        toast.success("Service saved successfully!");
      }
      queryClient.invalidateQueries("/selectserviceslist");
      handleClose();
    } catch {
      toast.error(isEdit ? "Failed to update service." : "Failed to save service.");
    }
  };

  const handleDeleteConfirm = (id) => setDeleteConfirm({ open: true, id });

  const handleDelete = async () => {
    try {
      await http.delete(`/deleteserviceslist?id=${deleteConfirm.id}`, {
        data: { deletedBy: accessToken?.username || accessToken?.name || accessToken?.EmployeeName || "system" }
      });
      toast.success("Service record deleted.");
      queryClient.invalidateQueries("/selectserviceslist");
      setDeleteConfirm({ open: false, id: null });
    } catch {
      toast.error("Failed to delete service.");
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const cellSx = {
    fontSize: "0.82rem", whiteSpace: "nowrap", px: 1.5, py: 1,
    borderBottom: "1px solid", borderColor: "divider",
  };
  const headerSx = {
    fontWeight: "bold", fontSize: "0.78rem", whiteSpace: "nowrap", px: 1.5, py: 1.2,
    backgroundColor: "action.hover", color: "text.secondary",
    textTransform: "uppercase", letterSpacing: "0.05em",
    borderBottom: "2px solid", borderColor: "divider",
  };
  const headerCells = ["#", "Service ID", "Service Name / Description", "Rate (₱)", "Renewal Period", "Actions"];

  const totalServices = servicesList.length;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

        {/* ── Single unified Paper card — same structure as ClientInt ── */}
        <Paper elevation={0} sx={paperSx}>

          {/* Row 1: Title + record count + Add button */}
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MiscellaneousServicesIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Typography variant="subtitle2" fontWeight="bold">Service Records</Typography>
              <Chip
                label={hasActiveFilters ? `${filteredList.length} of ${totalServices}` : `${totalServices} record${totalServices !== 1 ? "s" : ""}`}
                size="small" color="primary" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }}
              />
            </Box>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNew}>
              Add Service
            </Button>
          </Box>

          {/* Row 2: Filter inputs */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: hasActiveFilters ? "1px solid" : "none", borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <TextField
              placeholder="Search by name, ID, rate, renewal..." size="small" value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              sx={{ width: 280, ...inputSx }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchQuery(""); setPage(0); }}><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <TextField label="Renewal Period" select size="small" sx={{ width: 160, ...inputSx }}
              value={renewalFilter} onChange={(e) => { setRenewalFilter(e.target.value); setPage(0); }}>
              {RENEWAL_FILTER_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </TextField>
            <TextField
              label="Rate From (₱)" size="small" type="number" value={rateFrom}
              onChange={(e) => { setRateFrom(e.target.value); setPage(0); }}
              sx={{ width: 140, ...inputSx }}
              InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }}
            />
            <TextField
              label="Rate To (₱)" size="small" type="number" value={rateTo}
              onChange={(e) => { setRateTo(e.target.value); setPage(0); }}
              sx={{ width: 140, ...inputSx }}
              InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }}
            />
            {hasActiveFilters && (
              <Button variant="outlined" size="small" color="warning" startIcon={<FilterAltOffIcon />} onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </Box>

          {/* Row 3: Active filter chips (only when filters are active) */}
          {hasActiveFilters && (
            <Box sx={{ px: 2, py: 0.8, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Active filters:</Typography>
              {searchQuery && (
                <Chip label={`Search: "${searchQuery}"`} size="small"
                  onDelete={() => { setSearchQuery(""); setPage(0); }} sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {renewalFilter !== "All" && (
                <Chip label={`Renewal: ${RENEWAL_FILTER_OPTIONS.find(o => o.value === renewalFilter)?.label}`}
                  size="small" color="info"
                  onDelete={() => { setRenewalFilter("All"); setPage(0); }} sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {rateFrom && (
                <Chip label={`Rate ≥ ₱${rateFrom}`} size="small" color="success"
                  onDelete={() => { setRateFrom(""); setPage(0); }} sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {rateTo && (
                <Chip label={`Rate ≤ ₱${rateTo}`} size="small" color="success"
                  onDelete={() => { setRateTo(""); setPage(0); }} sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5 }}>
                — {filteredList.length} result{filteredList.length !== 1 ? "s" : ""} found
              </Typography>
            </Box>
          )}

          {/* Row 4: Table (directly inside the same Paper) */}
          <TableContainer sx={{ overflowX: "auto", maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {headerCells.map((label) => (
                    <TableCell key={label} sx={{
                      ...headerSx,
                      ...(label === "Rate (₱)" ? { textAlign: "right" } : {}),
                      ...(label === "Renewal Period" || label === "Actions" ? { textAlign: "center" } : {}),
                    }}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headerCells.length} align="center" sx={{ py: 5 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <MiscellaneousServicesIcon sx={{ fontSize: 30, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.disabled" fontSize="0.8rem" fontStyle="italic">
                          {hasActiveFilters ? "No records match your filters." : "No service records on file."}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedList.map((row, index) => (
                    <TableRow key={row.id} hover sx={{
                      backgroundColor: index % 2 === 0 ? "transparent" : "action.hover",
                      "&:hover": { backgroundColor: "action.selected" },
                    }}>
                      <TableCell sx={{ ...cellSx, color: "text.disabled", fontSize: "0.72rem", textAlign: "center", width: 50 }}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, cursor: "pointer", color: "primary.main", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}
                        onClick={() => setServiceInfo({ open: true, service: row })}>
                        <Chip label={row.ServiceID || "—"} size="small" variant="outlined"
                          sx={{ fontSize: "0.72rem", fontFamily: "monospace", cursor: "pointer" }} />
                      </TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 600, cursor: "pointer", color: "primary.main" }}
                        onClick={() => setServiceInfo({ open: true, service: row })}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          {row.ServiceName || "—"}
                          <InfoOutlinedIcon sx={{ fontSize: "0.85rem", color: "text.disabled", ml: 0.3 }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={cellSx} align="right">
                        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem", color: "success.main" }}>
                          ₱ {row.ServiceRate != null
                            ? parseFloat(row.ServiceRate).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "0.00"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={cellSx} align="center">
                        <RenewalChip totalMonths={row.ServiceRenewalMonths} />
                      </TableCell>
                      <TableCell sx={cellSx} align="center">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(row)}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(row.ID)}><DeleteIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]} component="div"
            count={filteredList.length} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{ borderTop: "1px solid", borderColor: "divider" }}
          />
        </Paper>

        {/* ── Add / Edit Dialog ── */}
        <ServiceFormDialog
          open={open} onClose={handleClose} onSave={handleSave}
          form={form} setForm={setForm} isEdit={isEdit} theme={theme}
        />

        {/* ── Delete Confirmation ── */}
        <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}
          PaperProps={{ sx: { borderRadius: 2, backgroundColor: darkMode ? "#161C24" : "#EAECEE" } }}>
          <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>Confirm Delete</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography>Are you sure you want to delete this service record? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", p: 2 }}>
            <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>

        {/* ── Service Info Dialog ── */}
        <ServiceInfoDialog
          open={serviceInfo.open}
          onClose={() => setServiceInfo({ open: false, service: null })}
          service={serviceInfo.service}
          theme={theme}
        />

      </Box>
    </LocalizationProvider>
  );
}