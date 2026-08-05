export interface CustomerUnpaid {
  customer: string;
  branch: string;
  amount: number;
}

export interface CustomerSummary {
  customer: string;
  branch: string;
  current: number;
  "1-30": number;
  "31-60": number;
  "61-90": number;
  "91-180": number;
  "over180": number;
  amountDue: number;
}

export interface UnpaidInvoice {
  customer: string;
  branch: string;
  number: string;
  date: string;
  dueDate: string;
  amountDue: number;
}

export interface PaidInvoiceSummary {
  customer: string;
  branch: string;
  currentMonth: number;
  lastMonth: number;
  last12Month: number;
}

export interface PaidVsUnpaidMonthly {
  customer?: string;
  period: string;
  branch: string;
  paid: number;
  unpaid: number;
}

export interface CustomerInvoice {
  customer: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  currency: string;
  amountInCurrency: number;
  amountInHomeCurrency: number;
  amountDueInHomeCurrency: number;
}

export interface UmcItem {
  customer: string;
  invoiceNo: string;
  dueDate: string;
  currency: string;
  amountInCurrency: number;
  amountInHomeCurrency: number;
}

export interface ArSummaryResponse {
  summary: {
    branch: string;
    customer: string;
    "unpaid-invoice": number;
    "overdue-amount": number;
    "overdue-30-plus": number;
    "overdue-90-plus": number;
  }[];
  "top-10-unpaid-customers": CustomerUnpaid[];
  "summary-customer": CustomerSummary[];
  "summary-unpaid": UnpaidInvoice[];
  "paid-invoices-summary": PaidInvoiceSummary[];
  "paid-vs-unpaid-monthly": PaidVsUnpaidMonthly[];
  "customer-invoices": CustomerInvoice[];
  "all-umc-this-year": UmcItem[];
}

export type FilterCategory = "all" | "anak-usaha" | "non-anak-usaha";
