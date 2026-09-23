import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ToolsPage from "./Tools";

vi.mock("@/components/site/SolarCalculator", () => ({
  default: () => <div>حاسبة وقت التشغيل</div>,
}));

vi.mock("@/components/site/SolarSystemDesigner", () => ({
  default: () => <div>مصمم منظومات الطاقة الشمسية</div>,
}));

vi.mock("@/components/seo/Seo", () => ({
  Seo: () => null,
  SITE_NAME: "UFUK AL-Basra",
}));

describe("engineering tools page", () => {
  it("offers the calculator, solar designer, and MUST inverter monitor", () => {
    render(
      <MemoryRouter
        initialEntries={["/tools"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ToolsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /حاسبة وقت التشغيل/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /مصمم منظومات الطاقة الشمسية/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /UFUK POWER — مراقبة العاكس/ })).toBeInTheDocument();
  });
});
