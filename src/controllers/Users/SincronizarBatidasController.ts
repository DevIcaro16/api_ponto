import { SincronizarBatidasService } from "../../services/Users/SincronizarBatidasServices";
import { Request, Response } from "express";

export class SincronizarBatidasController {

    async handle(req: Request, res: Response) {

        const sincronia = new SincronizarBatidasService();

        const userId = req.body

        const response = await sincronia.execute(userId);

        console.log(response);
        return res.status(response.statusCode).json(response);
    }

};