import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";

describe("Timeline", () => {
  it("renders day markers and titles", () => {
    render(
      <Timeline
        items={[
          { day: 1, title: "建立起点" },
          { day: 14, title: "生成结营报告" },
        ]}
      />,
    );

    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("建立起点")).toBeInTheDocument();
    expect(screen.getByText("Day 14")).toBeInTheDocument();
    expect(screen.getByText("生成结营报告")).toBeInTheDocument();
  });
});
