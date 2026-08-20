import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/trocas-e-devolucoes")({
  component: TrocasEDevolucoes,
});

function TrocasEDevolucoes() {
  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />

      <section className="flex-1 bg-[color:var(--cream)] py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-menu text-3xl md:text-4xl text-[color:var(--pink-deep)]">
            POLÍTICA DE TROCAS E DEVOLUÇÕES
          </h1>

          <div className="mt-8 space-y-6 text-foreground/80 leading-relaxed">
            <p>
              grande parte dos garimpos da Soft são peças vintages, ou seja, possuem anos de uso ou
              anos de desuso, algumas possuem desgastes que são naturais dos tecidos e outras
              possuem avarias (tudo sempre sinalizado nas descrições), a compra destas peças únicas
              deve ser feita com consciência desses fatores, por isso indicamos ler atentamente toda
              descrição de cada anúncio!
            </p>

            <div>
              <h2 className="font-menu text-xl text-[color:var(--pink-deep)] mb-2">TROCAS</h2>
              <p>
                não realizamos trocas, pois cada peça é diferente, não temos estoque com cores ou
                tamanhos diferentes para trocas!
              </p>
            </div>

            <div>
              <h2 className="font-menu text-xl text-[color:var(--pink-deep)] mb-2">DEVOLUÇÕES</h2>
              <p>
                se você precisar fazer a devolução de alguma peça entre em contato conosco pela DM
                para obter a resposta mais rápida, é possível fazer a devolução dentro do prazo de 7
                dias corridos após a entrega, conforme o Código de Defesa do Consumidor.
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-1.5">
                <li>
                  a peça deve ser devolvida nas mesmas condições em que você recebeu e na mesma
                  embalagem;
                </li>
                <li>o frete de devolução é de responsabilidade do cliente;</li>
                <li>
                  o valor do reembolso é referente apenas ao do produto (e não do frete inicial);
                </li>
                <li>
                  realizamos o estorno do valor via PIX assim que o pacote chegar de volta ao
                  remetente.
                </li>
              </ul>
            </div>

            <p>
              caso haja alguma outra dúvida não hesite em nos chamar, principalmente se for em
              relação a como tirar suas medidas, será um prazer ajudar!
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
