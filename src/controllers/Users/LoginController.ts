import { Request, Response } from "express";
import { LoginService } from "../../services/Users/LoginService";
import { getActiveLoginMethod } from "../../config/loginConfig";

class LoginController {

    async handle(req: Request, res: Response) {

        const { empresa, login, cpf, senha } = req.body;
        const loginMethod = getActiveLoginMethod();

        console.log('🔐 LoginController - Método ativo:', loginMethod);
        console.log('📝 LoginController - Dados recebidos:', { 
            empresa, 
            login, 
            cpf, 
            senha: '***' 
        });

        const loginService = new LoginService();

        const response = await loginService.execute({
            empresa,
            login,
            cpf,
            senha
        });

        console.log('📤 LoginController - Resposta:', response);
        return res.status(response.statusCode).json(response);
    }

}

export { LoginController };
