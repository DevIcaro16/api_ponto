import { Request, Response } from "express";
import { ExcluirPontoService } from "../../services/Users/ExcluirPontoService";

export class ExcluirPontoController {
    async handle(req: Request, res: Response) {

        const { id, userId, empresa, tipo, data, latitude, longitude } = req.body;

        const excluirPontoService = new ExcluirPontoService();

        const response = await excluirPontoService.execute({
            id,
            userId,
            empresa,
            tipo,
            data,
            latitude,
            longitude
        })

        console.log(response);
        return res.status(response.statusCode).json(response);
    }
};