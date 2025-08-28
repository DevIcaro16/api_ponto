import { funcionarios } from "@prisma/client";
import prismaClient from "../../prisma/prisma";
import * as bcrypt from 'bcrypt';

interface LoginServiceProps {
    empresa: string;
    login: string;
    senha: string;
}

interface UserResponse {
    success: boolean;
    message: string;
    statusCode: number;
    user?: funcionarios | null;
}

export class LoginService {

    async execute({ empresa, login, senha }: LoginServiceProps): Promise<UserResponse> {

        let isSuccess: boolean = true;
        let message: string = '';
        let statusCode: number = 200;

        console.log(login)
        console.log(senha);

        if (!empresa || !login || !senha) {
            isSuccess = false;
            message = "Todos os campos são obrigatórios!";
            statusCode = 400; // Bad Request
        }

        if (!isSuccess) {
            return {
                success: isSuccess,
                message,
                statusCode
            };
        }

        // Primeiro, buscar o usuário apenas por empresa e login
        const user = await prismaClient.funcionarios.findFirst({
            where: {
                empresa: empresa,
                login: login
            }
        });

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
