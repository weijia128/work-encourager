import { describe, expect, it } from "vitest";
import { defaultSettingsDraft } from "../../domain/settings";
import { formToSettings, settingsToForm } from "./form";

const now = new Date(2026, 10, 4, 15);

function form() {
  return settingsToForm(undefined, now);
}

describe("setup form conversion", () => {
  it("maps a large week to the previous Monday", () => {
    expect(
      formToSettings(
        {
          ...form(),
          nickname: "小叶",
          monthlySalary: "21000",
          restKind: "bigSmall",
          smallWeek: false,
        },
        now,
      ).restPolicy,
    ).toEqual({ kind: "bigSmall", smallWeekMonday: "2026-10-26" });
  });

  it("round trips the default draft fields", () => {
    const draft = defaultSettingsDraft();
    const settings = formToSettings(
      { ...form(), nickname: "小叶", monthlySalary: "21000", noLunch: true },
      now,
    );
    expect(settings.lunch).toBeNull();
    expect(settings.watchlist).toEqual(draft.watchlist);
  });
});
