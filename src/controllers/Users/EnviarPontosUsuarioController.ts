import { Request, Response } from "express";
import { EnviarPontosUsuarioService } from "../../services/Users/EnviarPontosUsuarioService";


export class EnviarPontosUsuarioController {

    async handle(req: Request, res: Response) {

        const { userID } = req.body;
        console.log(userID);

        const enviarPontosUsuarioService = new EnviarPontosUsuarioService()

        const response = await enviarPontosUsuarioService.execute({ userID });

        console.log(response);
        return res.status(response.statusCode).json(response);
    }

};