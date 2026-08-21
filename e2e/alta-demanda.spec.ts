import { test, expect, type Page } from "@playwright/test";

/**
 * Fluxos de "alta demanda": muita gente batendo no banco ao mesmo tempo.
 * Dois cenários:
 *  1) leitura concorrente do catálogo (mais visitas simultâneas do que o
 *     tamanho do pool de conexões MySQL — MYSQL_CONNECTION_LIMIT=5 por padrão);
 *  2) escrita concorrente: duas pessoas tentando fechar pedido da mesma
 *     peça única ao mesmo tempo.
 */

/** Depois de clicar em "pagar", a tela ou navega pro checkout hospedado do
 * gateway (sucesso — precisa de MERCADOPAGO_ACCESS_TOKEN configurado, que
 * este ambiente não tem) ou mostra um toast de erro. Sem chave de gateway
 * configurada, o pedido chega a ser reservado e só falha no passo seguinte
 * (criar a cobrança) — o que já é suficiente pra provar que a trava contra
 * vender a mesma peça duas vezes está funcionando: das duas tentativas
 * concorrentes, exatamente uma tem que esbarrar em "já foi vendida", nunca
 * as duas. */
async function aguardarDesfechoDoCheckout(page: Page) {
  const toast = page.locator("[data-sonner-toast]").first();
  const tipo = await Promise.race([
    toast.waitFor({ timeout: 15_000 }).then(() => "toast" as const),
    page
      .waitForURL((url) => !url.pathname.includes("/finalizar-compra"), { timeout: 15_000 })
      .then(() => "redirect" as const),
  ]);
  if (tipo === "redirect") {
    return { vendida: false, texto: `redirecionado pra ${page.url()}` };
  }
  const texto = (await toast.innerText()).trim();
  return { vendida: texto.toLowerCase().includes("vendida"), texto };
}

async function logarComContaDeTeste(page: Page) {
  await page.goto("/entrar");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("e-mail").fill("teste@soft.com");
  await page.getByLabel("senha").fill("teste1234");
  await page.getByRole("button", { name: "entrar", exact: true }).click();
  await page.waitForURL("**/");
}

/** Loga, vai até /produtos, adiciona a primeira peça do catálogo (mesma pra
 * todo mundo, já que a ordenação é fixa) e segue até a tela de revisão do
 * pedido, deixando "Confirmar pedido" pronto pro clique. Retorna o nome da
 * peça disputada, pra garantir que os dois compradores miraram na mesma. */
async function prepararCompraDaPrimeiraPeca(page: Page) {
  await logarComContaDeTeste(page);

  await page.goto("/produtos");
  await page.waitForLoadState("networkidle");

  const primeiroBotao = page.getByRole("button", { name: "comprar" }).first();
  const primeiroCard = page
    .locator("div.rounded-2xl")
    .filter({ has: primeiroBotao })
    .first();
  const nomeProduto = await primeiroCard.locator("p.font-menu").first().innerText();

  await primeiroBotao.click();
  await page.keyboard.press("Escape");

  await page.goto("/carrinho");
  await page.waitForLoadState("networkidle");
  // CEP de exemplo (Av. Paulista) só pra liberar o botão — o preço da peça
  // já ultrapassa o piso de frete grátis, então nenhuma cotação real é feita.
  await page.getByPlaceholder("CEP (00000-000)").fill("01310100");

  const finalizarBtn = page.getByRole("button", { name: "Finalizar compra" });
  await expect(finalizarBtn).toBeEnabled();
  await finalizarBtn.click();

  await page.waitForURL("**/finalizar-compra");
  await expect(page.getByRole("button", { name: "Pagar com Mercado Pago" })).toBeEnabled();

  return nomeProduto;
}

test.describe("alta demanda", () => {
  test("catálogo aguenta várias visitas simultâneas além do pool de conexões do MySQL", async ({
    browser,
  }) => {
    const CONCORRENTES = 10; // > MYSQL_CONNECTION_LIMIT (5 por padrão) de propósito

    const contexts = await Promise.all(
      Array.from({ length: CONCORRENTES }, () => browser.newContext()),
    );
    try {
      const resultados = await Promise.all(
        contexts.map(async (ctx) => {
          const page = await ctx.newPage();
          const resposta = await page.goto("/produtos");
          await page.waitForLoadState("networkidle");
          return { status: resposta?.status(), produtosVisiveis: await page.getByRole("heading", { name: "TODOS OS PRODUTOS" }).isVisible() };
        }),
      );

      for (const r of resultados) {
        expect(r.status).toBe(200);
        expect(r.produtosVisiveis).toBe(true);
      }
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.close()));
    }
  });

  test("duas compras simultâneas da mesma peça única — só uma pode vencer", async ({ browser }) => {
    test.slow(); // dois fluxos de login+checkout completos rodando em paralelo
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      const [nomeA, nomeB] = await Promise.all([
        prepararCompraDaPrimeiraPeca(pageA),
        prepararCompraDaPrimeiraPeca(pageB),
      ]);
      expect(nomeB).toBe(nomeA); // as duas compras miram na mesma peça

      const pagarA = pageA.getByRole("button", { name: "Pagar com Mercado Pago" });
      const pagarB = pageB.getByRole("button", { name: "Pagar com Mercado Pago" });

      // Dispara as duas tentativas de pagamento o mais perto possível uma da
      // outra, pra elas concorrerem de verdade pela mesma linha no banco.
      await Promise.all([pagarA.click(), pagarB.click()]);

      const [desfechoA, desfechoB] = await Promise.all([
        aguardarDesfechoDoCheckout(pageA),
        aguardarDesfechoDoCheckout(pageB),
      ]);

      const desfechos = [desfechoA, desfechoB];
      const vendidas = desfechos.filter((d) => d.vendida);

      // regra de negócio anunciada em /sobre-a-sacolinha: "cada peça da Soft
      // é uma unidade só... se outra pessoa fechar o pedido primeiro, ele sai
      // do catálogo pra sempre". Com as duas compras disparadas ao mesmo
      // tempo, exatamente uma tem que esbarrar em "já foi vendida" — nunca
      // as duas, e nunca nenhuma.
      expect(
        vendidas.length,
        `esperava exatamente 1 tentativa barrada por "já vendida", veio: ${JSON.stringify(desfechos)}`,
      ).toBe(1);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
