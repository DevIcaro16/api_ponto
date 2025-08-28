import prismaClient from "../../prisma/prisma";

interface ExcluirPontoServiceProps {
    id: number;
    userId: number;
    empresa: string;
    tipo: number;
    data: Date;
    latitude: string;
    longitude: string;
};

interface ExcluirPontoServiceResponse {
    success: boolean;
    message: string;
    statusCode: number;
};

export class ExcluirPontoService {

    async execute({ id, userId, empresa, tipo, data, latitude, longitude }: ExcluirPontoServiceProps): Promise<ExcluirPontoServiceResponse> {
        let isSuccess: boolean = true;
        let message: string = '';
        let statusCode: number = 200;

        try {
            const camposFaltando = [];

            if (!id) camposFaltando.push("id");
            if (!userId) camposFaltando.push("userId");
            if (!empresa) camposFaltando.push("empresa");
            if (!tipo) camposFaltando.push("tipo");
            if (!data) camposFaltando.push("data");
            if (!latitude) camposFaltando.push("latitude");
            if (!longitude) camposFaltando.push("longitude");

            if (camposFaltando.length > 0) {
                return {
                    success: false,
                    message: `Informações Inválidas! Campos ausentes: ${camposFaltando.join(", ")}`,
                    statusCode: 400
                };
            }

            // usando ponto_batidas como substituto para pontos
            const deletePonto = await prismaClient.ponto_batidas.delete({
                where: {
                    id // Usando apenas ID para simplificar a query
                }
            });

            if (!deletePonto) {
                return {
                    success: false,
                    message: "Ponto não Encontrado!",
                    statusCode: 404
                };
            }

            return {
                success: true,
                message: "Ponto Excluído com Sucesso!",
                statusCode: 201
            };
        } catch (error: any) {
            console.log(error);

            return {
                success: false,
                message: error.message || "Erro ao Excluir Ponto!",
                statusCode: 500
            };
        }
    }

};