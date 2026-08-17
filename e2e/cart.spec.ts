import { test, expect } from "@playwright/test";

test.describe("sacolinha (carrinho)", () => {
  test("adicionar um produto atualiza o contador e aparece no carrinho", async ({ page }) => {
    await page.goto("/produtos");
    // espera a página hidratar antes de interagir, senão o clique no botão
    // (que só funciona via handler React) não tem efeito nenhum.
    await page.waitForLoadState("networkidle");

    const addButtons = page.getByRole("button", { name: "Adicionar ao carrinho" });
    const total = await addButtons.count();
    test.skip(total === 0, "nenhum produto disponível para testar o carrinho");

    const primeiroCard = page
      .locator("div.rounded-2xl")
      .filter({ has: page.getByRole("button", { name: "Adicionar ao carrinho" }) })
      .first();
    const nomeProduto = await primeiroCard.locator("p.font-menu").first().innerText();

    await addButtons.first().click();

    // o modal da sacolinha abre automaticamente ao adicionar um item
    const modal = page.getByRole("dialog", { name: "sua sacolinha" });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(nomeProduto)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();

    await expect(page.getByRole("button", { name: "carrinho", exact: true })).toContainText("1");

    await page.goto("/carrinho");
    await expect(page.getByText(nomeProduto)).toBeVisible();
  });

  test("carrinho vazio mostra mensagem e link para produtos", async ({ page }) => {
    await page.goto("/carrinho");

    await expect(page.getByText("sua sacolinha está vazia")).toBeVisible();
    await page.getByRole("link", { name: "ir pros produtos" }).click();
    await expect(page).toHaveURL(/\/produtos/);
  });
});
