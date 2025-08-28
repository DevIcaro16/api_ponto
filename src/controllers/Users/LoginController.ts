import { Request, Response } from "express";
import { LoginService } from "../../services/Users/LoginService";

class LoginController {

    async handle(req: Request, res: Response) {

        const { empresa, login, senha } = req.body;

        const loginService = new LoginService();

        const response = await loginService.execute({
            empresa,
            login,
            senha
        });

        console.log(response);
        return res.status(response.statusCode).json(response);
    }

}

export { LoginController };
