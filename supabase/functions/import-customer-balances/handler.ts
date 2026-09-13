import {
  CustomerBalanceImportError,
  MAX_CUSTOMER_BALANCE_FILE_SIZE,
  parseCustomerBalanceWorkbook,
  type CustomerBalanceImportRow,
} from "./importer.ts";

export const customerBalanceCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AuthenticatedUser = { id: string };

export type HandlerDependencies = {
  authenticate: (token: string) => Promise<AuthenticatedUser | null>;
  canManage: (userId: string, token: string) => Promise<boolean>;
  parseWorkbook: typeof parseCustomerBalanceWorkbook;
  replaceBalances: (input: {
    fileName: string;
    rows: CustomerBalanceImportRow[];
    token: string;
  }) => Promise<{ imported: number }>;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...customerBalanceCorsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function bearerToken(req: Request): string | null {
  const match = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function isUploadedFile(value: FormDataEntryValue): value is File {
  return (
    typeof value !== "string" &&
    typeof value.name === "string" &&
    typeof value.arrayBuffer === "function"
  );
}

export function sanitizeCustomerBalanceFileName(value: string): string {
  const baseName = value.split(/[\\/]/).pop() ?? "";
  const sanitized = Array.from(baseName)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint > 31 && codePoint !== 127;
    })
    .join("")
    .trim();
  return (sanitized || "balances.xlsx").slice(0, 255);
}

function databaseErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { code?: unknown; message?: unknown };
  if (typeof candidate.code === "string") return candidate.code;
  return typeof candidate.message === "string" && candidate.message.includes("import in progress")
    ? "55P03"
    : "";
}

export async function handleImportCustomerBalances(
  req: Request,
  deps: HandlerDependencies,
): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: customerBalanceCorsHeaders });
  }
  if (req.method !== "POST") {
    return json({ code: "method_not_allowed", message: "طريقة الطلب غير مدعومة." }, 405);
  }

  const token = bearerToken(req);
  if (!token) return json({ code: "unauthorized", message: "يجب تسجيل الدخول أولًا." }, 401);

  let user: AuthenticatedUser | null;
  try {
    user = await deps.authenticate(token);
  } catch {
    user = null;
  }
  if (!user) return json({ code: "unauthorized", message: "انتهت جلسة الدخول أو أصبحت غير صالحة." }, 401);

  let permitted = false;
  try {
    permitted = await deps.canManage(user.id, token);
  } catch {
    permitted = false;
  }
  if (!permitted) {
    return json({ code: "forbidden", message: "ليس لديك صلاحية لتحديث أرصدة العملاء." }, 403);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return json({ code: "invalid_request", message: "تعذّر قراءة بيانات الرفع." }, 400);
  }
  const files = formData.getAll("file").filter(isUploadedFile);
  if (files.length !== 1) {
    return json({ code: "file_required", message: "يرجى اختيار ملف Excel واحد." }, 400);
  }

  const file = files[0];
  if (file.size > MAX_CUSTOMER_BALANCE_FILE_SIZE) {
    return json({ code: "file_too_large", message: "حجم الملف أكبر من الحد المسموح (5 ميغابايت)." }, 400);
  }

  let rows: CustomerBalanceImportRow[];
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    rows = deps.parseWorkbook({
      bytes,
      fileName: file.name,
      mimeType: file.type,
    });
  } catch (error) {
    if (error instanceof CustomerBalanceImportError) {
      return json({ code: error.code, message: error.message }, 400);
    }
    return json({ code: "unreadable_workbook", message: "تعذّر قراءة ملف Excel." }, 400);
  }

  try {
    const result = await deps.replaceBalances({
      fileName: sanitizeCustomerBalanceFileName(file.name),
      rows,
      token,
    });
    return json({ imported: result.imported });
  } catch (error) {
    if (databaseErrorCode(error) === "55P03") {
      return json(
        { code: "import_in_progress", message: "يوجد تحديث آخر قيد التنفيذ. يرجى الانتظار قليلًا." },
        409,
      );
    }
    return json({ code: "replacement_failed", message: "فشل تحديث الأرصدة. بقيت البيانات السابقة دون تغيير." }, 500);
  }
}

export const defaultCustomerBalanceHandlerDependencies: Pick<
  HandlerDependencies,
  "parseWorkbook"
> = {
  parseWorkbook: parseCustomerBalanceWorkbook,
};
