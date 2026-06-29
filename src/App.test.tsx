import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App foundation", () => {
  it("renders the One Day demo shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "One Day" })).toBeInTheDocument();
    expect(screen.getByText("One Day Demo")).toBeInTheDocument();
  });
});
