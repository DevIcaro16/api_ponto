import { SincronizarService } from "../../services/Users/SincronizarService";
import { Request, Response } from "express";

export class SincronizarController {

    async handle(req: Request, res: Response) {

        const sincronia = new SincronizarService();

        const response = await sincronia.execute();

        console.log(response);
        return res.status(response.statusCode).json(response);
    }

};