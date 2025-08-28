import { ponto_batidas } from "@prisma/client";
import prismaClient from "../../prisma/prisma";
import { subDays } from "date-fns";

interface EnviarPontosUsuarioServiceProps {
    userID: number;
}

interface EnviarPontosUsuarioServiceResponse {
    success: boolean;
    message: string;
    statusCode: number;
    pontos: ponto_batidas[] | null; // usando ponto_batidas como substituto para pontos
}

export class EnviarPontosUsuarioService {

    async execute({ userID }: EnviarPontosUsuarioServiceProps): Promise<EnviarPontosUsuarioServiceResponse> {

        let isSuccess: boolean = true;
        let message: string = "";
        let statusCode: number = 200;

        console.log(userID);

        if (!userID || userID === undefined) {
            return {
                success: false,
                message: "Nenhum usuário informado.",
                statusCode: 400,
                pontos: null
            };
        }

        try {


            const dataLimite = subDays(new Date(), 300 ).toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm" → "YYYY-MM-DD HH:mm"

            // usando ponto_batidas como substituto para pontos
            const pontosUsuario = await prismaClient.ponto_batidas.findMany({
                where: {
                    funcionario_id: userID, // userId agora é funcionario_id
                    dat: { // campo de data é 'dat' no novo schema
                        gte: new Date(dataLimite),
                    },
                },
                orderBy: {
                    id: 'desc'
                }
            });

            if (!pontosUsuario || pontosUsuario.length == 0) {
                console.log("Nenhum ponto registrado encontrado para o funcionário nos últimos 300 dias");
                // Não é erro, apenas não há dados - retorna sucesso com array vazio
                isSuccess = true;
                message = "Nenhum ponto registrado encontrado";
                statusCode = 200;
            }

            return {
                success: isSuccess,
                message: pontosUsuario && pontosUsuario.length > 0 ? "Batidas de ponto resgatadas com sucesso!" : message,
                statusCode,
                pontos: pontosUsuario || [] // sempre retorna array, mesmo que vazio
            };
        } catch (error: any) {
            console.error("Erro na sincronização:", error);

            return {
                success: false,
                message: error.message || "Erro desconhecido ao sincronizar.",
                statusCode: 500,
                pontos: null
            };
        }
    }
};
