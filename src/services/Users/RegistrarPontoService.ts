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

            // Verificar se já existe um ponto similar (mesmo funcionário, mesmo dia, mesma localização)
            const pontoExistente = await prismaClient.ponto_batidas.findFirst({
                where: {
                    funcionario_id: pontoData.funcionario_id,
                    dat: {
                        gte: new Date(new Date(pontoData.dat).setHours(0, 0, 0, 0)),
                        lt: new Date(new Date(pontoData.dat).setHours(23, 59, 59, 999))
                    },
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

            // Função para ajustar timezone do Brasil (UTC-3)
            const ajustarTimezoneBrasil = (data: Date): Date => {
                const dataUTC = new Date(data);
                // Subtrair 3 horas para ajustar para o horário do Brasil
                dataUTC.setHours(dataUTC.getHours() - 3);
                return dataUTC;
            };

            const dataProcessamento = ajustarTimezoneBrasil(new Date());
            
            console.log("📅 Timestamps para salvar:", {
                dat_original: pontoData.dat,
                dat_parsed: new Date(pontoData.dat),
                processo_ajustado: dataProcessamento,
                processo_original: new Date()
            });

            // Criar o ponto na base de dados
            const novoPonto = await prismaClient.ponto_batidas.create({
                data: {
                    funcionario_id: pontoData.funcionario_id,
                    emp: pontoData.emp,
                    dat: new Date(pontoData.dat),
                    hora: pontoData.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    locacao_id: pontoData.locacao_id || null,
                    origem: pontoData.origem || "mobile",
                    lat: pontoData.lat || null,
                    lng: pontoData.lng || null,
                    endereco: pontoData.endereco || null,
                    distancia_m: pontoData.distancia_m || null,
                    status: pontoData.status || "registrado",
                    justificativa: pontoData.justificativa || "",
                    processo: dataProcessamento, // Forçar timestamp correto do Brasil
                    ori: pontoData.ori || "00:00"
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
