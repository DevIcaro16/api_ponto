import { ponto_batidas } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface ReceberPontosProps {
    pontosRequest: any[]; // usando any[] pois pode vir dados do app mobile com estrutura diferente
}

interface ReceberPontosResponse {
    success: boolean;
    message: string;
    statusCode: number;
}

export class ReceberPontosService {

    async execute({ pontosRequest }: ReceberPontosProps): Promise<ReceberPontosResponse> {

        if (!pontosRequest || pontosRequest.length === 0) {
            return {
                success: false,
                message: "Nenhum ponto foi recebido.",
                statusCode: 400,
            };
        }

        try {

            const formatarDataAppParaServ = (data: Date): Date => {
                const novaData = new Date(data);
                novaData.setHours(novaData.getHours() - 3);
                // console.log(novaData);
                return novaData;
            };

            console.log("🔄 Buscando pontos existentes no banco...");

            // usando ponto_batidas como substituto para pontos
            const pontosServidor = await prismaClient.ponto_batidas.findMany({
                orderBy: { id: 'desc' }
            });

            console.log(`✅ ${pontosServidor.length} pontos carregados do banco.`);

            // Função para formatar a chave de forma consistente - apenas campos reais
            const formatarChave = (ponto: any) => {
                const dataFormatada = formatarDataAppParaServ(new Date(ponto.dat || ponto.data)).toISOString();
                const lat = ponto.lat || ponto.latitude ? Number(ponto.lat || ponto.latitude).toFixed(6) : "null";
                const lng = ponto.lng || ponto.longitude ? Number(ponto.lng || ponto.longitude).toFixed(6) : "null";
                const funcionario_id = ponto.funcionario_id || ponto.userId;
                return `${funcionario_id}-${dataFormatada}-${lat}-${lng}`;
            };

            // Criar mapa de pontos existentes no banco
            const mapaServidor = new Map(pontosServidor.map(ponto => [formatarChave(ponto), true]));

            console.log("📌 Filtrando novos pontos...");
            const novosPontos = pontosRequest.filter(ponto => !mapaServidor.has(formatarChave(ponto)));

            console.log(`🔍 ${novosPontos.length} novos pontos identificados para inserção.`);

            if (novosPontos.length === 0) {
                return {
                    success: true,
                    message: "Todos os pontos já estavam registrados.",
                    statusCode: 200,
                };
            }

            function capitalize(text: string): string {
                return text.charAt(0).toUpperCase() + text.slice(1);
            }

            // Preparando para inserção no BD - apenas campos da tabela ponto_batidas
            const pontosFormatados = novosPontos.map((ponto) => ({
                funcionario_id: ponto.userId || ponto.funcionario_id,
                emp: ponto.empresa || ponto.emp,
                dat: formatarDataAppParaServ(ponto.data || ponto.dat),
                hora: ponto.hora || "00:00",
                locacao_id: ponto.cliente_id || ponto.locacao_id || null,
                origem: ponto.origem || "mobile",
                lat: ponto.latitude || ponto.lat ? parseFloat(ponto.latitude || ponto.lat) : null,
                lng: ponto.longitude || ponto.lng ? parseFloat(ponto.longitude || ponto.lng) : null,
                endereco: ponto.endereco || null,
                distancia_m: ponto.distancia || ponto.distancia_m ? parseInt(ponto.distancia || ponto.distancia_m) : null,
                status: ponto.status || "novo",
                justificativa: ponto.justificativa,
                ori: ponto.ori || "00:00"
            }));

            console.log(`📝 Inserindo ${pontosFormatados.length} novos pontos no banco...`);
            const pontosInseridos = await prismaClient.ponto_batidas.createMany({ data: pontosFormatados });

            if (!pontosInseridos.count) {
                throw new Error("Nenhum registro foi inserido.");
            }

            console.log(`✅ ${pontosInseridos.count} pontos registrados com sucesso!`);
            return {
                success: true,
                message: `${pontosInseridos.count} pontos registrados com sucesso!`,
                statusCode: 200,
            };

        } catch (error: any) {
            console.error("❌ Erro ao registrar pontos:", error.message);
            return {
                success: false,
                message: "Erro ao registrar pontos. Por favor, tente novamente.",
                statusCode: 500,
            };
        }


    }

}
