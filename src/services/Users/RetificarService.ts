import { ponto_eventos, ponto_eventos_tipo } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface RetificarProps {
    data: Date | null;
    tipo: number | null;
    latitude: string | null;
    longitude: string | null;
    pontoId: number | null;
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

    // Função para gerar ID único
    private generateUniqueId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const userId = Math.floor(Math.random() * 10000);
        return `${timestamp}_${random}_${userId}`;
    }

    async execute({ requisicao, data, tipo, latitude, longitude, pontoId }: RetificarProps): Promise<RetificarResponse> {
        try {
            console.log('=== INICIANDO RETIFICAR SERVICE ===');
            console.log('Dados recebidos:', { requisicao, data, tipo, latitude, longitude, pontoId });

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
            console.log('=== DETERMINAÇÃO DO TIPO ===');
            console.log('requisicao.subcategoria:', requisicao.subcategoria);
            console.log('requisicao.subcategoria type:', typeof requisicao.subcategoria);
            console.log('requisicao.subcategoria.toLowerCase():', requisicao.subcategoria?.toLowerCase());
            
            let tipoEvento: ponto_eventos_tipo;
            switch (requisicao.subcategoria.toLowerCase()) {
                case 'justificativa':
                    tipoEvento = 'JUSTIFICATIVA';
                    break;
                case 'atestado':
                    tipoEvento = 'ATESTADO';
                    break;
                case 'sistema':
                    tipoEvento = 'SISTEMA';
                    break;
                case 'app':
                    tipoEvento = 'APP';
                    break;
                case 'outro':
                    tipoEvento = 'OUTRO';
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
            console.log('Tipo de evento (string):', JSON.stringify(tipoEvento));

            // Validar se o tipo é válido
            const tiposValidos = ['JUSTIFICATIVA', 'ATESTADO', 'SISTEMA', 'APP', 'OUTRO', 'AFST', 'AJUSTE'];
            if (!tiposValidos.includes(tipoEvento)) {
                console.error('Tipo de evento inválido:', tipoEvento);
                tipoEvento = 'JUSTIFICATIVA'; // Fallback para valor válido
            }

                        // 3. Processar anexo (se houver)
            let anexoUrl: string | null = null;
            if (requisicao.anexo) {
                try {
                    // O anexo já foi processado no frontend e enviado como caminho FTP
                    anexoUrl = requisicao.anexo;
                    console.log('Anexo recebido do frontend:', anexoUrl);
                } catch (anexoError) {
                    console.warn('Erro ao processar anexo:', anexoError);
                    // Continuar mesmo sem anexo
                }
            }

            // 4. Definir datas de início e fim
            const dataInicio = requisicao.data_inicio || new Date();
            const dataFim = requisicao.data_termino || null;

            console.log('Datas definidas:', { dataInicio, dataFim });

            // 5. Determinar se é retificação ou justificativa
            const isRetificacao = tipoEvento === 'AJUSTE' || tipoEvento === 'SISTEMA' || tipoEvento === 'APP';
            
            let pontoEvento = null;
            
            if (!isRetificacao) {
                // Para justificativas, criar evento na tabela ponto_eventos
                pontoEvento = await prismaClient.ponto_eventos.create({
                    data: {
                        emp: funcionario.emp,
                        funcionario_id: requisicao.user_id,
                        tipo: tipoEvento as any, // Cast temporário até regenerar o Prisma Client
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
                console.log('Evento de justificativa criado com sucesso:', pontoEvento);
            } else {
                console.log('É uma retificação - anexo será salvo em ponto_batidas');
            }

            // 6. Tentar atualizar a tabela pontos_batidas se houver pontoId
            console.log('Verificando se deve atualizar ponto_batidas:', { data, tipo, pontoId });
            if (pontoId) {
                console.log('Evento relacionado a ponto específico:', { data, tipo, pontoId });
                
                try {
                    // Buscar o ponto específico na tabela pontos_batidas pelo ID
                    console.log('Buscando ponto com ID:', pontoId);
                    
                    let pontoEspecifico = await prismaClient.ponto_batidas.findUnique({
                        where: {
                            id: pontoId
                        }
                    });
                    
                    console.log('Ponto encontrado:', pontoEspecifico);
                    
                    if (pontoEspecifico) {
                        // Atualizar o campo justificativa com o tipo do evento
                        const tipoJustificativa = `${tipoEvento}: ${requisicao.titulo}`;
                        
                        // Preparar dados para atualização
                        const updateData: any = {
                            justificativa: tipoJustificativa
                        };
                        
                        // Se for retificação, incluir o anexo e tip no ponto_batidas
                        if (isRetificacao) {
                            console.log('🔍 isRetificacao é true, processando anexo e tip...');
                            console.log('🔍 anexoUrl:', anexoUrl);
                            
                            if (anexoUrl) {
                                updateData.anexo = anexoUrl;
                                console.log('Incluindo anexo no ponto_batidas para retificação:', anexoUrl);
                            } else {
                                console.log('⚠️ anexoUrl é null ou undefined');
                            }
                            
                            // Determinar o tip baseado na posição do ponto no dia
                            const pontosDoDia = await prismaClient.ponto_batidas.findMany({
                                where: {
                                    funcionario_id: pontoEspecifico.funcionario_id,
                                    dat: pontoEspecifico.dat
                                },
                                orderBy: {
                                    hora: 'asc'
                                }
                            });
                            
                            console.log('🔍 Pontos do dia encontrados:', pontosDoDia.length);
                            
                            const posicaoNoDia = pontosDoDia.findIndex(p => p.id === pontoEspecifico.id);
                            let tip = "ent1";
                            if (posicaoNoDia === 1) tip = "sai1";
                            else if (posicaoNoDia === 2) tip = "ent2";
                            else if (posicaoNoDia === 3) tip = "sai2";
                            else if (posicaoNoDia > 3) tip = "ext";
                            
                            updateData.tip = tip;
                            console.log(`Definindo tip para retificação: ${tip} (posição ${posicaoNoDia} no dia)`);
                            console.log('🔍 updateData completo:', updateData);
                        } else {
                            console.log('🔍 isRetificacao é false, não processando anexo e tip');
                        }
                        
                        console.log('Atualizando ponto com dados:', {
                            pontoId: pontoEspecifico.id,
                            updateData: updateData,
                            isRetificacao: isRetificacao
                        });
                        
                        const pontoAtualizado = await prismaClient.ponto_batidas.update({
                            where: {
                                id: pontoEspecifico.id
                            },
                            data: updateData
                        });

                        console.log(`Ponto atualizado com sucesso:`, pontoAtualizado);
                    } else {
                        console.log('Ponto específico não encontrado para atualização');
                    }
                } catch (updateError) {
                    console.error('Erro ao atualizar ponto específico:', updateError);
                    // Não falhar a operação principal se a atualização do ponto falhar
                }
            }

            // Preparar resposta baseada no tipo de operação
            const responseData = isRetificacao ? {
                id: pontoId,
                tipo: tipoEvento,
                message: "Retificação aplicada com sucesso!",
                status: 'Aplicado'
            } : {
                id: pontoEvento?.id,
                tipo: pontoEvento?.tipo,
                data_inicio: pontoEvento?.data_inicio,
                data_fim: pontoEvento?.data_fim,
                status: pontoEvento?.aprovado === 'S' ? 'Aprovado' : 'Pendente'
            };

            return {
                success: true,
                message: isRetificacao ? "Retificação aplicada com sucesso!" : "Solicitação enviada com sucesso! Aguarde aprovação.",
                statusCode: 201,
                data: responseData
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
            return `anexo_${this.generateUniqueId()}.jpg`;
        } catch (error) {
            console.warn('Erro ao processar anexo:', error);
            return null;
        }
    }
};