import { ponto_batidas } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface RegistrarPontoProps {
    funcionario_id: number;
    emp: string;
    dat: Date;
    hora: string;
    locacao_id?: number | null;
    origem?: string;
    lat?: number | null;
    lng?: number | null;
    endereco?: string | null;
    distancia_m?: number | null;
    status?: string;
    justificativa?: string;
    ori?: string;
}

interface RegistrarPontoResponse {
    success: boolean;
    message: string;
    statusCode: number;
    ponto?: ponto_batidas;
}

export class RegistrarPontoService {

    async execute(pontoData: RegistrarPontoProps): Promise<RegistrarPontoResponse> {

        if (!pontoData.funcionario_id || !pontoData.emp || !pontoData.dat) {
            return {
                success: false,
                message: "Dados obrigatórios não informados (funcionario_id, emp, dat).",
                statusCode: 400,
            };
        }

        try {

            console.log("📍 Registrando novo ponto:", {
                funcionario_id: pontoData.funcionario_id,
                emp: pontoData.emp,
                dat: pontoData.dat,
                hora: pontoData.hora,
                lat: pontoData.lat,
                lng: pontoData.lng
            });

            // Criar a data correta para verificação (apenas data, sem hora)
            const dataAtual = new Date();
            const dataCorreta = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
            
            // Verificar se já existe um ponto similar (mesmo funcionário, mesmo dia, mesma localização)
            const pontoExistente = await prismaClient.ponto_batidas.findFirst({
                where: {
                    funcionario_id: pontoData.funcionario_id,
                    dat: dataCorreta, // Usar data exata
                    // Verifica se já existe um ponto no mesmo horário (com margem de 5 minutos)
                    hora: pontoData.hora
                }
            });

            if (pontoExistente) {
                return {
                    success: false,
                    message: "Já existe um ponto registrado neste horário para hoje.",
                    statusCode: 409, // Conflict
                };
            }

            // Ajustar timestamp para horário do Brasil (-3 horas)
            const agora = new Date();
            const dataProcessamento = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
            
            console.log("⏰ DEBUG - Timestamp processo:", {
                agora_servidor: agora.toISOString(),
                agora_servidor_local: agora.toLocaleString('pt-BR'),
                processo_brasil: dataProcessamento.toISOString(),
                processo_brasil_local: dataProcessamento.toLocaleString('pt-BR'),
                diferenca_horas: "-3 horas",
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            
            console.log("📅 DEBUG - Datas para salvar:", {
                dat_original: pontoData.dat,
                dat_parsed: new Date(pontoData.dat),
                data_correta: dataCorreta,
                data_correta_iso: dataCorreta.toISOString(),
                processo: dataProcessamento
            });

            // Criar o ponto na base de dados
            const novoPonto = await prismaClient.ponto_batidas.create({
                data: {
                    funcionario_id: pontoData.funcionario_id,
                    emp: pontoData.emp,
                    dat: dataCorreta, // Usar data local correta
                    hora: pontoData.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    locacao_id: pontoData.locacao_id || null,
                    origem: pontoData.origem || "mobile",
                    lat: pontoData.lat || null,
                    lng: pontoData.lng || null,
                    endereco: pontoData.endereco || null,
                    distancia_m: pontoData.distancia_m || null,
                    status: pontoData.status || "registrado",
                    justificativa: pontoData.justificativa || "",
                    processo: dataProcessamento, // Timestamp atual do servidor
                    ori: pontoData.hora || "00:00"
                }
            });

            console.log("✅ Ponto registrado com sucesso! ID:", novoPonto.id);

            return {
                success: true,
                message: "Ponto registrado com sucesso!",
                statusCode: 201,
                ponto: novoPonto
            };

        } catch (error: any) {
            console.error("❌ Erro ao registrar ponto:", error.message);
            return {
                success: false,
                message: "Erro interno do servidor ao registrar ponto.",
                statusCode: 500,
            };
        }
    }
}
