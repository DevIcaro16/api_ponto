import { funcionarios } from "@prisma/client";
import prismaClient from "../../prisma/prisma";
import * as bcrypt from 'bcrypt';
import { getActiveLoginMethod, isTraditionalLogin, isCpfLogin } from "../../config/loginConfig";

interface LoginServiceProps {
    // Campos para login tradicional
    empresa?: string;
    login?: string;
    // Campos para login por CPF
    cpf?: string;
    // Campo comum
    senha: string;
}

interface UserResponse {
    success: boolean;
    message: string;
    statusCode: number;
    user?: funcionarios | null;
}

export class LoginService {

    async execute({ empresa, login, cpf, senha }: LoginServiceProps): Promise<UserResponse> {

        let isSuccess: boolean = true;
        let message: string = '';
        let statusCode: number = 200;
        const loginMethod = getActiveLoginMethod();

        console.log('🔐 Método de login ativo:', loginMethod);
        console.log('📝 Dados recebidos:', { empresa, login, cpf, senha: '***' });

        // Validação baseada no método de login ativo
        if (isTraditionalLogin()) {
            if (!empresa || !login || !senha) {
                isSuccess = false;
                message = 'Empresa, login e senha são obrigatórios';
                statusCode = 400;
            }
        } else if (isCpfLogin()) {
            if (!cpf || !senha) {
                isSuccess = false;
                message = 'CPF e senha são obrigatórios';
                statusCode = 400;
            }
        }

        if (!isSuccess) {
            return {
                success: isSuccess,
                message,
                statusCode
            };
        }

        // Buscar o usuário baseado no método de login ativo
        let user: funcionarios | null = null;
        
        if (isTraditionalLogin()) {
            console.log('🔍 Buscando usuário por empresa e login...');
            user = await prismaClient.funcionarios.findFirst({
                where: {
                    empresa: empresa,
                    login: login
                }
            });
        } else if (isCpfLogin()) {
            console.log('🔍 Buscando usuário por CPF...');
            // Limpar CPF (remover pontos, traços, espaços)
            const cpfLimpo = cpf?.replace(/[^\d]/g, '') || '';
            console.log('🔍 CPF limpo:', cpfLimpo);
            
            user = await prismaClient.funcionarios.findFirst({
                where: {
                    cpf: cpfLimpo
                }
            });
        }

        if (!user) {
            console.log("Usuário Não Encontrado!");
            isSuccess = false;
            message = "Usuário ou senha inválidos!";
            statusCode = 404;
        } else {
            // Verificar a senha usando bcrypt
            // Converter hash do PHP ($2y$) para formato compatível com Node.js ($2b$)
            let hashParaComparar = user.senha || '';
            if (hashParaComparar.startsWith('$2y$')) {
                hashParaComparar = hashParaComparar.replace('$2y$', '$2b$');
            }
            
            const senhaValida = await bcrypt.compare(senha, hashParaComparar);
            console.log('Resultado da verificação:', senhaValida);
            
            if (!senhaValida) {
                console.log("Senha Inválida!");
                isSuccess = false;
                message = "Usuário ou senha inválidos!";
                statusCode = 401; // Unauthorized
            }
        }

        // const funcionario = await prismaClient.funcionarios.findFirst({
        //     where: {
        //         idfuncionario: user?.id
        //     }
        // });

        // if (!funcionario) {
        //     console.log("Usuário Não Encontrado!");
        //     isSuccess = false;
        //     message = "Usuário Não Encontrado!";
        //     statusCode = 404;
        // }

        // console.log(response)
        return {
            success: isSuccess,
            message: isSuccess == true ? "Login efetuado com Sucesso!" : message,
            statusCode,
            user: isSuccess ? user : null,
        }; // Retorna tanto a resposta quanto o código de status
    }
}
