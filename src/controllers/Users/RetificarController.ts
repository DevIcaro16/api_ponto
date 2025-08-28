import { Request, Response } from "express";
import { RetificarService } from "../../services/Users/RetificarService";

export class RetificarController {
    async handle(req: Request, res: Response) {
        try {
            console.log('=== DADOS RECEBIDOS NO CONTROLLER ===');
            console.log('Body completo:', JSON.stringify(req.body, null, 2));

            const {
                data,
                tipo,
                latitude,
                longitude,
                requisicao
            } = req.body;

            // Validação dos dados obrigatórios
            if (!requisicao || !requisicao.user_id || !requisicao.titulo || !requisicao.descricao || !requisicao.subcategoria) {
                return res.status(400).json({
                    success: false,
                    message: "Dados obrigatórios não fornecidos (user_id, titulo, descricao, subcategoria)",
                    statusCode: 400
                });
            }

            const retificacao = new RetificarService();

            const response = await retificacao.execute({
                requisicao: {
                    user_id: parseInt(requisicao.user_id),
                    titulo: requisicao.titulo,
                    descricao: requisicao.descricao,
                    anexo: requisicao.anexo ?? null,
                    subcategoria: requisicao.subcategoria,
                    data_inicio: requisicao.data_inicio ? new Date(requisicao.data_inicio) : null,
                    data_termino: requisicao.data_termino ? new Date(requisicao.data_termino) : null
                },
                data: data ? new Date(data) : null,
                tipo: tipo ? parseInt(tipo) : null,
                latitude: latitude || null,
                longitude: longitude || null
            });

            return res.status(response.statusCode).json(response);
        } catch (error) {
            console.error('Erro no RetificarController:', error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor",
                statusCode: 500
            });
        }
    }
}
