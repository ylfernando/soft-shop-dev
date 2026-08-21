import { test, expect } from "@playwright/test";

test.describe("navegação principal", () => {
  test("home carrega e mostra o header com o carrinho zerado", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Soft Shop logo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "carrinho", exact: true })).toContainText("0");
  });

  test("acessa a página 'sobre a sacolinha' pelo menu", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "sacolinha" }).click();

    await expect(page).toHaveURL(/\/sobre-a-sacolinha$/);
    await expect(page.getByRole("heading", { name: "SOBRE A SACOLINHA" })).toBeVisible();
  });

  test("acessa a listagem de produtos pelo menu", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "new drop", exact: true }).click();

    await expect(page).toHaveURL(/\/produtos/);
    await expect(page.getByRole("heading", { name: "TODOS OS PRODUTOS" })).toBeVisible();
  });
});
