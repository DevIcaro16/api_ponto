import { ponto_batidas } from "@prisma/client";
import prismaClient from "../../prisma/prisma";
import { format, formatInTimeZone } from "date-fns-tz";
import { addHours } from "date-fns";

interface SincronizarBatidasProps {
    userId: number;
};

interface Ponto {
    // Interface limpa - apenas campos que existem na tabela ponto_batidas
    id: number;
    funcionario_id: number; // usando nome real do campo
    emp: string; // usando nome real do campo
    dat: string; // usando nome real do campo
    hora?: string;
    locacao_id: number | null;
    origem: string;
    lat: number | null;
    lng: number | null;
    endereco?: string;
    distancia_m: number | null;
    status: string | null;
    created_at: string;
    deleted_at?: string | null;
    justificativa: string;
    processo: string;
    ori: string;
}



interface SincronizarResponse {
    success: boolean;
    message: string;
    statusCode: number;
    pontos?: Ponto[] | null;
};

export class SincronizarBatidasService {



    async execute({ userId }: SincronizarBatidasProps): Promise<SincronizarResponse> {
        let isSuccess: boolean = true;
        let message: string = '';
        let statusCode: number = 200;

        try {
            const hoje = new Date();
            const dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - 30);

            // usando ponto_batidas como substituto para pontos
            const pontos = await prismaClient.ponto_batidas.findMany({
                where: {
                    funcionario_id: userId, // userId → funcionario_id
                    dat: { // data → dat
                        gte: dataInicio,
                        lte: hoje
                    },
                },
                orderBy: {
                    id: 'desc'
                }
            });

            const pontosConvertidos: Ponto[] = pontos.map(ponto => ({
                // Mapeamento direto - apenas campos que existem na tabela ponto_batidas
                id: ponto.id,
                funcionario_id: ponto.funcionario_id,
                emp: ponto.emp,
                dat: format(addHours(ponto.dat, 3), "yyyy-MM-dd HH:mm:ss"),
                hora: ponto.hora || undefined,
                locacao_id: ponto.locacao_id,
                origem: ponto.origem,
                lat: ponto.lat !== null ? Number(ponto.lat) : null,
                lng: ponto.lng !== null ? Number(ponto.lng) : null,
                endereco: ponto.endereco || undefined,
                distancia_m: ponto.distancia_m,
                status: ponto.status,
                created_at: format(ponto.created_at, "yyyy-MM-dd HH:mm:ss"),
                deleted_at: ponto.deleted_at ? format(ponto.deleted_at, "yyyy-MM-dd HH:mm:ss") : null,
                justificativa: ponto.justificativa,
                processo: format(ponto.processo, "yyyy-MM-dd HH:mm:ss"),
                ori: ponto.ori
            }));

            return {
                success: isSuccess,
                message: "Dados retornados com sucesso!",
                statusCode,
                pontos: pontosConvertidos
            };

        } catch (error: any) {
            console.error("Erro na sincronização:", error);

            return {
                success: false,
                message: error.message || "Erro desconhecido ao sincronizar.",
                statusCode: 500
            };
        }
    }



};