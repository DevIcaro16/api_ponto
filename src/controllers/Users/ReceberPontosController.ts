import { Request, Response } from "express";
import { ReceberPontosService } from "../../services/Users/ReceberPontosService";

export class ReceberPontosController {

    async handle(req: Request, res: Response) {

        const { pontosRequest } = req.body;

        const receberPontosService = new ReceberPontosService()

        const response = await receberPontosService.execute({ pontosRequest });

        console.log(response);
        return res.status(response.statusCode).json(response);
    }

};