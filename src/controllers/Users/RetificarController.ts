import { Request, Response } from "express";
import { RetificarService } from "../../services/Users/RetificarService";

export class RetificarController {
    async handle(req: Request, res: Response) {
        const {
            data,
            tipo,
            latitude,
            longitude,
            userId,
            title,
            descript,
            anexo,
            subcategoria,
            data_inicio,
            data_termino
        } = req.body;

        const retificacao = new RetificarService();

        const response = await retificacao.execute({
            requisicao: {
                user_id: parseInt(userId),
                titulo: title,
                descricao: descript,
                anexo: anexo ?? null,
                subCategoria: subcategoria,
                data_inicio: data_inicio ? new Date(data_inicio) : null,
                data_termino: data_termino ? new Date(data_termino) : null
            },
            data: new Date(data),
            tipo: parseInt(tipo),
            latitude: latitude || '',
            longitude: longitude || ''
        });

        return res.status(response.statusCode).json(response);
    }
}
