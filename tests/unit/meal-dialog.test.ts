import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AddMealDialog } from "@/components/food/AddMealDialog";

afterEach(cleanup);

it("clears an unfinished food item when the meal dialog is reopened", () => {
  const props = { isOpen: true, onClose: vi.fn(), onSave: vi.fn(), isPending: false,
    initialData: { mealType: "Lunch", foodItems: [] } };
  const { rerender } = render(React.createElement(AddMealDialog, props));
  fireEvent.change(screen.getByPlaceholderText("e.g. Chicken Breast"), {
    target: { value: "Unfinished soup" },
  });
  rerender(React.createElement(AddMealDialog, { ...props, isOpen: false }));
  rerender(React.createElement(AddMealDialog, props));
  expect((screen.getByPlaceholderText("e.g. Chicken Breast") as HTMLInputElement).value).toBe("");
});
