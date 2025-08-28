import { ponto_eventos, ponto_eventos_tipo } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface RetificarProps {
    data: Date | null;
    tipo: number | null;
    latitude: string | null;
    longitude: string | null;
    requisicao: {
        user_id: number;
        titulo: string;
        descricao: string;
        anexo: string | null;
        subcategoria: string;
        data_inicio: Date | null;
        data_termino: Date | null;
    };
}

interface RetificarResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data?: any;
}

// Interface para abstração do provedor de armazenamento de imagens
interface ImageStorageProvider {
    uploadImage(file: any): Promise<string>;
    deleteImage(url: string): Promise<void>;
}

// Implementação futura do Cloudinary (abstração)
class CloudinaryProvider implements ImageStorageProvider {
    async uploadImage(file: any): Promise<string> {
        // TODO: Implementar upload no Cloudinary
        // return await cloudinary.uploader.upload(file);
        throw new Error("Cloudinary provider not implemented yet");
    }
    
    async deleteImage(url: string): Promise<void> {
        // TODO: Implementar remoção no Cloudinary
        // return await cloudinary.uploader.destroy(url);
        throw new Error("Cloudinary provider not implemented yet");
    }
}

export class RetificarService {
    private imageStorage?: ImageStorageProvider;

    constructor() {
        // Por enquanto, não inicializar o provedor de imagem
        // this.imageStorage = new CloudinaryProvider();
    }

    async execute({ requisicao, data, tipo, latitude, longitude }: RetificarProps): Promise<RetificarResponse> {
        try {
            console.log('=== INICIANDO RETIFICAR SERVICE ===');
            console.log('Dados recebidos:', { requisicao, data, tipo, latitude, longitude });

            // 1. Buscar informações do funcionário para obter emp
            const funcionario = await prismaClient.funcionarios.findUnique({
                where: {
                    id: requisicao.user_id
                },
                select: {
                    id: true,
                    emp: true,
                    nome: true
                }
            });

            if (!funcionario || !funcionario.emp) {
                console.log('Funcionário não encontrado ou sem emp:', funcionario);
                return {
                    success: false,
                    message: "Funcionário não encontrado ou dados incompletos!",
                    statusCode: 404
                };
            }

            console.log('Funcionário encontrado:', funcionario);

            // 2. Determinar o tipo de evento baseado na subcategoria
            let tipoEvento: ponto_eventos_tipo;
            switch (requisicao.subcategoria.toLowerCase()) {
                case 'justificativa':
                    tipoEvento = 'JUSTIFICATIVA';
                    break;
                case 'afst':
                    tipoEvento = 'AFST';
                    break;
                case 'ajuste':
                    tipoEvento = 'AJUSTE';
                    break;
                default:
                    tipoEvento = 'JUSTIFICATIVA'; // Default
                    break;
            }

            console.log('Tipo de evento determinado:', tipoEvento);

            // 3. Processar anexo (se houver)
            let anexoUrl: string | null = null;
            if (requisicao.anexo) {
                try {
                    // TODO: Implementar upload de anexo quando o provedor estiver pronto
                    if (this.imageStorage) {
                        anexoUrl = await this.imageStorage.uploadImage(requisicao.anexo);
                    } else {
                        // Por enquanto, simular que o anexo foi processado
                        anexoUrl = `temp_anexo_${Date.now()}.jpg`; // Placeholder
                    }
                    console.log('Anexo processado (placeholder):', anexoUrl);
                } catch (anexoError) {
                    console.warn('Erro ao processar anexo:', anexoError);
                    // Continuar mesmo sem anexo
                }
            }

            // 4. Definir datas de início e fim
            const dataInicio = requisicao.data_inicio || new Date();
            const dataFim = requisicao.data_termino || null;

            console.log('Datas definidas:', { dataInicio, dataFim });

            // 5. Criar evento na tabela ponto_eventos
            const pontoEvento = await prismaClient.ponto_eventos.create({
                data: {
                    emp: funcionario.emp,
                    funcionario_id: requisicao.user_id,
                    tipo: tipoEvento,
                    data_inicio: dataInicio,
                    data_fim: dataFim,
                    motivo: requisicao.titulo,
                    observacao: requisicao.descricao,
                    anexo: anexoUrl,
                    aprovado: 'N', // Padrão: não aprovado
                    aprovado_por: null,
                    aprovado_em: null
                }
            });

            console.log('Evento criado com sucesso:', pontoEvento);

            // 6. Se foi relacionado a um ponto específico, podemos adicionar lógica adicional aqui
            if (data && tipo) {
                console.log('Evento relacionado a ponto específico:', { data, tipo });
                // TODO: Implementar lógica adicional se necessário
            }

            return {
                success: true,
                message: "Solicitação enviada com sucesso! Aguarde aprovação.",
                statusCode: 201,
                data: {
                    id: pontoEvento.id,
                    tipo: pontoEvento.tipo,
                    data_inicio: pontoEvento.data_inicio,
                    data_fim: pontoEvento.data_fim,
                    status: pontoEvento.aprovado === 'S' ? 'Aprovado' : 'Pendente'
                }
            };

        } catch (error) {
            console.error("=== ERRO NO RETIFICAR SERVICE ===", error);

            // Tratamento de erros específicos do Prisma
            if (error instanceof Error) {
                if (error.message.includes('Foreign key constraint')) {
                    return {
                        success: false,
                        message: "Dados de referência inválidos. Verifique os dados informados.",
                        statusCode: 400
                    };
                }
                
                if (error.message.includes('Unique constraint')) {
                    return {
                        success: false,
                        message: "Já existe uma solicitação similar. Verifique seus dados.",
                        statusCode: 409
                    };
                }
            }

            return {
                success: false,
                message: "Erro interno do servidor. Tente novamente mais tarde.",
                statusCode: 500
            };
        }
    }

    // Método auxiliar para processar anexos no futuro
    private async processAnexo(anexo: string | null): Promise<string | null> {
        if (!anexo) return null;
        
        try {
            // TODO: Implementar quando o provedor de imagem estiver configurado
            if (this.imageStorage) {
                return await this.imageStorage.uploadImage(anexo);
            }
            
            // Por enquanto, retornar placeholder
            return `anexo_${Date.now()}.jpg`;
        } catch (error) {
            console.warn('Erro ao processar anexo:', error);
            return null;
        }
    }
};