import { Request, Response } from 'express';
import { BuscarFuncionarioCompletoService } from '../../services/Users/BuscarFuncionarioCompletoService';

export class BuscarFuncionarioCompletoController {
    async handle(req: Request, res: Response) {
        const { funcionario_id } = req.body;

        const buscarFuncionarioCompletoService = new BuscarFuncionarioCompletoService();

        try {
            const result = await buscarFuncionarioCompletoService.execute({
                funcionario_id: parseInt(funcionario_id)
            });

            return res.status(result.statusCode).json(result);

        } catch (error) {
            console.error('Erro no controller BuscarFuncionarioCompleto:', error);
            return res.status(500).json({
                success: false,
                message: "Erro interno do servidor",
                statusCode: 500
            });
        }
    }
}
