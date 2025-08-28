import { funcionarios, funcoes, parametros, locacoes, ponto_eventos } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface SincronizarResponse {
    success: boolean;
    message: string;
    statusCode: number;
    empresas?: parametros[] | null, // usando parametros que tem campo empresa
    clientes?: locacoes[] | null; // usando locacoes como substituto para clientes
    funcoes?: funcoes[] | null;
    users?: funcionarios[] | null; // users agora é funcionarios
    parametros?: parametros[] | null; // parametros_spice agora é parametros
    requisicoes?: ponto_eventos[] | null; // usando ponto_eventos como substituto
};

export class SincronizarService {

    async execute(): Promise<SincronizarResponse> {

        let isSuccess: boolean = true;
        let message: string = '';
        let statusCode: number = 200;

        try {

            // usando parametros que contém informações da empresa
            const empresas = await prismaClient.parametros.findMany({
                orderBy: {
                    id: 'desc'
                }
            });

            // usando locacoes como substituto para clientes
            const clientes = await prismaClient.locacoes.findMany({
                orderBy: {
                    id: 'desc'
                }
            });

            const funcoes = await prismaClient.funcoes.findMany({
                orderBy: {
                    id: 'desc'
                }
            });

            // users agora é funcionarios
            const users = await prismaClient.funcionarios.findMany({
                orderBy: {
                    id: 'desc'
                }
            });

            // parametros_spice agora é parametros
            const parametros = await prismaClient.parametros.findMany({
                orderBy: {
                    id: 'desc'
                }
            });

            // usando ponto_eventos como substituto para requisicoes
            const requisicoes = await prismaClient.ponto_eventos.findMany({
                orderBy: {
                    id: 'desc'
                }
            });


            // Verificações com fallbacks - mantendo compatibilidade com o sistema antigo
            if (empresas.length === 0) {
                console.log("Parâmetros de empresa não encontrados! (usando tabela 'parametros' como fallback para 'empresas')");
                // Não marcamos como erro pois pode não ter dados ainda
            }

            if (clientes.length === 0) {
                console.log("Locações não encontradas! (usando tabela 'locacoes' como fallback para 'clientes')");
                // Não marcamos como erro pois pode não ter dados ainda
            }

            if (funcoes.length === 0) {
                console.log("Funções não encontradas!");
                // Não marcamos como erro pois pode não ter dados ainda
            }

            if (users.length === 0) {
                console.log("Funcionários não encontrados! (usando tabela 'funcionarios' como fallback para 'users')");
                // Não marcamos como erro pois pode não ter dados ainda
            }

            if (parametros.length === 0) {
                console.log("Parâmetros não encontrados! (usando tabela 'parametros' como fallback para 'parametros_spice')");
                // Não marcamos como erro pois pode não ter dados ainda
            }

            if (requisicoes.length === 0) {
                console.log("Eventos de ponto não encontrados! (usando tabela 'ponto_eventos' como fallback para 'requisicoes')");
                // Não marcamos como erro pois pode não ter dados ainda
            }

            // Só marca como erro se NENHUMA tabela tiver dados
            const totalRecords = empresas.length + clientes.length + funcoes.length + users.length + parametros.length + requisicoes.length;
            if (totalRecords === 0) {
                console.log("Nenhum dado encontrado em nenhuma tabela!");
                isSuccess = false;
                message = "Nenhum dado encontrado para sincronização!";
                statusCode = 404;
            }

            return {
                success: isSuccess,
                message: isSuccess == true ? "Dados retornados com Sucesso!" : message,
                statusCode,
                empresas: empresas.length > 0 ? empresas : null,
                clientes: clientes.length > 0 ? clientes : null,
                funcoes: funcoes.length > 0 ? funcoes : null,
                users: users.length > 0 ? users : null,
                parametros: parametros.length > 0 ? parametros : null,
                requisicoes: requisicoes.length > 0 ? requisicoes : null
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