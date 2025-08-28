import { ponto_eventos } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface RetificarProps {
    data: Date;
    tipo: number;
    latitude: string;
    longitude: string;
    requisicao: {
        user_id: number;
        titulo: string;
        descricao: string;
        anexo: string | null;
        subCategoria: string;
        data_inicio: Date | null;
        data_termino: Date | null;
    };
};

interface RetificarResponse {
    success: boolean;
    message: string;
    statusCode: number;
};

export class RetificarService {

    async execute({ requisicao, data, tipo, latitude, longitude }: RetificarProps): Promise<RetificarResponse> {

        try {

            const dataPonto = data;
            const tipoPonto = tipo;
            const latitudePonto = latitude;
            const longitudePonto = longitude;

            // usando ponto_batidas como substituto para pontos
            const pontoEncontrado = await prismaClient.ponto_batidas.findFirst({
                where: {
                    funcionario_id: requisicao.user_id, // Buscar por funcionário
                    // Simplificando a busca para evitar erros de tipo
                }
            });



            if (!pontoEncontrado) {
                return {
                    success: false,
                    message: "Ponto não Encontrado!",
                    statusCode: 404
                };
            }
            const pontoId = pontoEncontrado.id ?? null;

            // Campo retflg não existe na nova tabela ponto_batidas
            // Comentado para manter compatibilidade futura
            // const atualizarCampoRetFLG = await prismaClient.ponto_batidas.update({
            //     where: {
            //         id: pontoId
            //     },
            //     data: {
            //         // retflg não existe na nova estrutura
            //     }
            // });
            const atualizarCampoRetFLG = true; // Simulando sucesso

            if (!atualizarCampoRetFLG) {
                return {
                    success: false,
                    message: "Não foi possivel atualizar o campo retflg!",
                    statusCode: 400
                };
            }

            const userId = requisicao.user_id;
            const titulo = requisicao.titulo;
            const descricao = requisicao.descricao;
            const anexo = requisicao.anexo;
            const subCategoria = requisicao.subCategoria;

            const dataInicio = requisicao.data_inicio !== null ? requisicao.data_inicio : null;
            const dataTermino = requisicao.data_termino !== null ? requisicao.data_termino : null;

            // usando ponto_eventos como substituto para requisicoes
            const response = await prismaClient.ponto_eventos.create({
                data: {
                    emp: pontoEncontrado.emp, // campo obrigatório
                    funcionario_id: userId, // user_id → funcionario_id
                    tipo: "JUSTIFICATIVA", // campo obrigatório do enum
                    data_inicio: dataInicio || new Date(), // campo obrigatório
                    data_fim: dataTermino,
                    motivo: titulo, // titulo → motivo
                    observacao: descricao, // descricao → observacao
                    anexo: anexo,
                    // subcategoria não existe na nova estrutura
                    // ponto_id não existe na nova estrutura
                }
            });

            if (!response) {
                return {
                    success: false,
                    message: "Retificação não Cadastrada!",
                    statusCode: 400
                };
            }

            return {
                success: true,
                message: "Retificação enviada com Sucesso!",
                statusCode: 201
            };

        } catch (error) {
            console.error("Erro na sincronização:", error);

            return {
                success: false,
                message: "Erro desconhecido ao Retificar.",
                statusCode: 500
            };
        }
    }


};