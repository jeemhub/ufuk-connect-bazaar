import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CustomerBalances from "@/pages/admin/CustomerBalances";

const mocks = vi.hoisted(() => ({
  useBalances: vi.fn(),
  useImportState: vi.fn(),
  upload: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("./useCustomerBalances", () => ({
  useCustomerBalances: mocks.useBalances,
  useCustomerBalanceImportState: mocks.useImportState,
}));

vi.mock("./api", async (loadOriginal) => ({
  ...(await loadOriginal<typeof import("./api")>()),
  uploadCustomerBalances: mocks.upload,
}));

vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CustomerBalances />
    </QueryClientProvider>,
  );
}

describe("customer balances admin page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useBalances.mockReturnValue({
      data: {
        rows: [
          {
            customer_number: "101",
            customer_name: "شركة الاختبار",
            debit_usd: "1234567.125",
            credit_usd: "0",
            debit_iqd: "0.000",
            credit_iqd: "2500000",
          },
        ],
        total: 101,
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    mocks.useImportState.mockReturnValue({
      data: {
        file_name: "1111.xls",
        imported_at: "2026-09-13T08:30:00Z",
        imported_by: "admin-1",
        row_count: 1885,
      },
      isLoading: false,
    });
  });

  it("shows the required Arabic controls and a responsive formatted table", async () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "أرصدة العملاء" })).toBeInTheDocument();
    expect(screen.getByText("البحث واستعراض أرصدة العملاء بالدولار والدينار")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ابحث باسم العميل أو رقمه")).toBeInTheDocument();
    expect(screen.getByLabelText("نوع الرصيد")).toBeInTheDocument();
    expect(screen.getByLabelText("العملة")).toBeInTheDocument();
    expect(screen.getByText("جميع الأرصدة")).toBeInTheDocument();
    expect(screen.getByText("جميع العملات")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إعادة ضبط الفلاتر" })).toBeInTheDocument();
    expect(screen.getByText("عدد النتائج: 101")).toBeInTheDocument();

    for (const header of [
      "رقم العميل",
      "اسم العميل",
      "مدين – دولار",
      "دائن – دولار",
      "مدين – دينار",
      "دائن – دينار",
    ]) expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();

    expect(screen.getByText("1,234,567.125")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.getByText("2,500,000")).toBeInTheDocument();
    expect(screen.getByTestId("balances-scroll")).toHaveClass("overflow-x-auto", "max-h-[65vh]");
    expect(screen.getByRole("columnheader", { name: "رقم العميل" })).toHaveClass("sticky", "top-0");
    expect(screen.getByRole("button", { name: "الصفحة التالية" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "الصفحة التالية" }));
    expect(mocks.useBalances.mock.calls.at(-1)?.[0].page).toBe(2);

    expect(screen.getByLabelText("اختيار ملف الأرصدة")).toHaveAttribute(
      "accept",
      expect.stringContaining(".xls,.xlsx"),
    );
  });

  it("debounces search for 250ms and resets it with the filters", () => {
    vi.useFakeTimers();
    renderPage();
    const input = screen.getByPlaceholderText("ابحث باسم العميل أو رقمه");

    fireEvent.change(input, { target: { value: "  أحمد  " } });
    expect(mocks.useBalances.mock.calls.at(-1)?.[0].query).toBe("");
    act(() => vi.advanceTimersByTime(249));
    expect(mocks.useBalances.mock.calls.at(-1)?.[0].query).toBe("");
    act(() => vi.advanceTimersByTime(1));
    expect(mocks.useBalances.mock.calls.at(-1)?.[0].query).toBe("  أحمد  ");

    fireEvent.click(screen.getByRole("button", { name: "إعادة ضبط الفلاتر" }));
    act(() => vi.advanceTimersByTime(250));
    expect(input).toHaveValue("");
    vi.useRealTimers();
  });

  it("confirms replacement, blocks duplicate upload, and reports success", async () => {
    let finish!: (value: { imported: number }) => void;
    mocks.upload.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    renderPage();

    const input = screen.getByLabelText("اختيار ملف الأرصدة");
    const file = new File(["xls"], "1111.xls", { type: "application/vnd.ms-excel" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("1111.xls", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(
      "سيؤدي رفع الملف الجديد إلى استبدال بيانات الأرصدة الحالية بالكامل. هل تريد المتابعة؟",
    )).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "متابعة" }));
    expect(await screen.findByRole("button", { name: "جارٍ الرفع..." })).toBeDisabled();

    finish({ imported: 1885 });
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("تم تحديث ملف الأرصدة بنجاح"));
  });

  it("keeps the current view and shows the required empty state", () => {
    mocks.useBalances.mockReturnValue({
      data: { rows: [], total: 0 },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    renderPage();
    expect(screen.getByText("لا توجد نتائج مطابقة لبحثك")).toBeInTheDocument();
  });

  it("keeps existing results when a replacement upload fails", async () => {
    mocks.upload.mockRejectedValue(new Error("أعمدة الملف المطلوبة غير موجودة"));
    renderPage();
    const file = new File(["bad"], "bad.xls", { type: "application/vnd.ms-excel" });
    fireEvent.change(screen.getByLabelText("اختيار ملف الأرصدة"), { target: { files: [file] } });
    fireEvent.click(await screen.findByRole("button", { name: "متابعة" }));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("أعمدة الملف المطلوبة غير موجودة"));
    expect(screen.getByText("شركة الاختبار")).toBeInTheDocument();
    expect(screen.getByText("1,234,567.125")).toBeInTheDocument();
  });
});
