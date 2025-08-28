import { Request, Response } from "express";
import { RegistrarPontoService } from "../../services/Users/RegistrarPontoService";

export class RegistrarPontoController {

    async handle(req: Request, res: Response) {

        const pontoData = req.body;

        const registrarPontoService = new RegistrarPontoService()

        const response = await registrarPontoService.execute(pontoData);

        console.log(response);
        return res.status(response.statusCode).json(response);
    }

}
