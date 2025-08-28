import { funcionarios } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface BuscarFuncionarioCompletoProps {
    funcionario_id: number;
}

interface FuncionarioCompleto extends funcionarios {
    locacao_nome?: string;
    setor_nome?: string;
    funcao_nome?: string;
    escala_nome?: string;
}

interface FuncionarioCompletoResponse {
    success: boolean;
    message: string;
    statusCode: number;
    funcionario?: FuncionarioCompleto | null;
}

export class BuscarFuncionarioCompletoService {

    async execute({ funcionario_id }: BuscarFuncionarioCompletoProps): Promise<FuncionarioCompletoResponse> {

        let isSuccess: boolean = true;
        let message: string = '';
        let statusCode: number = 200;

        if (!funcionario_id) {
            isSuccess = false;
            message = "ID do funcionário é obrigatório!";
            statusCode = 400; // Bad Request
        }

        if (!isSuccess) {
            return {
                success: isSuccess,
                message,
                statusCode
            };
        }

        try {
            // Buscar funcionário com informações básicas
            const funcionario = await prismaClient.funcionarios.findFirst({
                where: {
                    id: funcionario_id,
                    deleted_at: null // Apenas funcionários ativos
                }
            });

            if (!funcionario) {
                console.log("Funcionário não encontrado!");
                isSuccess = false;
                message = "Funcionário não encontrado!";
                statusCode = 404;
                return {
                    success: isSuccess,
                    message,
                    statusCode
                };
            }

            // Criar objeto com informações básicas
            const funcionarioCompleto: FuncionarioCompleto = {
                ...funcionario
            };

            // Buscar nome da locação se existir
            if (funcionario.locacao_id) {
                try {
                    const locacao = await prismaClient.locacoes.findFirst({
                        where: {
                            id: funcionario.locacao_id,
                            deleted_at: null
                        },
                        select: { nome: true }
                    });
                    funcionarioCompleto.locacao_nome = locacao?.nome || 'N/A';
                } catch (error) {
                    console.error('Erro ao buscar locação:', error);
                    funcionarioCompleto.locacao_nome = 'Erro ao carregar';
                }
            }

            // Buscar nome do setor se existir
            if (funcionario.setor_id) {
                try {
                    const setor = await prismaClient.setores.findFirst({
                        where: {
                            id: funcionario.setor_id,
                            deleted_at: null
                        },
                        select: { nome: true }
                    });
                    funcionarioCompleto.setor_nome = setor?.nome || 'N/A';
                } catch (error) {
                    console.error('Erro ao buscar setor:', error);
                    funcionarioCompleto.setor_nome = 'Erro ao carregar';
                }
            }

            // Buscar nome da função se existir
            if (funcionario.funcao_id) {
                try {
                    const funcao = await prismaClient.funcoes.findFirst({
                        where: {
                            id: funcionario.funcao_id,
                            deleted_at: null
                        },
                        select: { nome: true }
                    });
                    funcionarioCompleto.funcao_nome = funcao?.nome || 'N/A';
                } catch (error) {
                    console.error('Erro ao buscar função:', error);
                    funcionarioCompleto.funcao_nome = 'Erro ao carregar';
                }
            }

            // Buscar nome da escala se existir
            if (funcionario.escala_id) {
                try {
                    const escala = await prismaClient.escalas.findFirst({
                        where: {
                            id: funcionario.escala_id,
                            deleted_at: null
                        },
                        select: { nome: true }
                    });
                    funcionarioCompleto.escala_nome = escala?.nome || 'N/A';
                } catch (error) {
                    console.error('Erro ao buscar escala:', error);
                    funcionarioCompleto.escala_nome = 'Erro ao carregar';
                }
            }

            return {
                success: isSuccess,
                message: "Funcionário encontrado com sucesso!",
                statusCode,
                funcionario: funcionarioCompleto,
            };

        } catch (error) {
            console.error('Erro ao buscar funcionário completo:', error);
            return {
                success: false,
                message: "Erro interno do servidor",
                statusCode: 500,
            };
        }
    }
}
