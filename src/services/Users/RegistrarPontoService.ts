import { ponto_batidas } from "@prisma/client";
import prismaClient from "../../prisma/prisma";

interface RegistrarPontoProps {
    funcionario_id: number;
    emp: string;
    dat: Date;
    hora: string;
    locacao_id?: number | null;
    origem?: string;
    lat?: number | null;
    lng?: number | null;
    endereco?: string | null;
    distancia_m?: number | null;
    status?: string;
    justificativa?: string;
    ori?: string;
}

interface RegistrarPontoResponse {
    success: boolean;
    message: string;
    statusCode: number;
    ponto?: ponto_batidas;
}

export class RegistrarPontoService {

    async execute(pontoData: RegistrarPontoProps): Promise<RegistrarPontoResponse> {

        if (!pontoData.funcionario_id || !pontoData.emp || !pontoData.dat) {
            return {
                success: false,
                message: "Dados obrigatórios não informados (funcionario_id, emp, dat).",
                statusCode: 400,
            };
        }

        try {

            console.log("📍 Registrando novo ponto:", {
                funcionario_id: pontoData.funcionario_id,
                emp: pontoData.emp,
                dat: pontoData.dat,
                hora: pontoData.hora,
                lat: pontoData.lat,
                lng: pontoData.lng
            });

            // Criar a data correta para verificação (apenas data, sem hora)
            // Usar UTC para manter consistência com os dados existentes
            const dataAtual = new Date();
            const dataCorreta = new Date(Date.UTC(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate()));
            
            // Verificar se já existe um ponto similar (mesmo funcionário, mesmo dia, mesma localização)
            const pontoExistente = await prismaClient.ponto_batidas.findFirst({
                where: {
                    funcionario_id: pontoData.funcionario_id,
                    dat: dataCorreta, // Usar data exata
                    // Verifica se já existe um ponto no mesmo horário (com margem de 5 minutos)
                    hora: pontoData.hora
                }
            });

            if (pontoExistente) {
                return {
                    success: false,
                    message: "Já existe um ponto registrado neste horário para hoje.",
                    statusCode: 409, // Conflict
                };
            }

            // Contar quantos pontos o funcionário já tem no dia para determinar o tipo
            console.log('🔍 Buscando pontos do dia com:', {
                funcionario_id: pontoData.funcionario_id,
                dat: dataCorreta,
                dat_iso: dataCorreta.toISOString()
            });
            
            const pontosDoDia = await prismaClient.ponto_batidas.count({
                where: {
                    funcionario_id: pontoData.funcionario_id,
                    dat: dataCorreta
                }
            });
            
            // Buscar também os pontos existentes para debug
            const pontosExistentes = await prismaClient.ponto_batidas.findMany({
                where: {
                    funcionario_id: pontoData.funcionario_id,
                    dat: dataCorreta
                },
                select: {
                    id: true,
                    dat: true,
                    hora: true,
                    tip: true
                }
            });
            
            console.log('🔍 Pontos existentes encontrados:', pontosExistentes);

            // Determinar o tipo de batida baseado na quantidade de pontos do dia
            // Se já tem 0 pontos, este será o 1º (ent1)
            // Se já tem 1 ponto, este será o 2º (sai1)
            // Se já tem 2 pontos, este será o 3º (ent2)
            // Se já tem 3 pontos, este será o 4º (sai2)
            // Se já tem 4+ pontos, este será extra (ext)
            let tip = "ent1"; // Primeiro ponto do dia
            if (pontosDoDia === 1) tip = "sai1"; // Segundo ponto do dia
            else if (pontosDoDia === 2) tip = "ent2"; // Terceiro ponto do dia
            else if (pontosDoDia === 3) tip = "sai2"; // Quarto ponto do dia
            else if (pontosDoDia >= 4) tip = "ext"; // Pontos extras
            
            console.log(`🔍 Lógica do tip: pontosDoDia=${pontosDoDia}, tip=${tip}`);

            console.log(`📊 Funcionário ${pontoData.funcionario_id} tem ${pontosDoDia} pontos hoje. Próximo tipo: ${tip}`);
            console.log('🔍 Dados que serão salvos:', {
                funcionario_id: pontoData.funcionario_id,
                emp: pontoData.emp,
                dat: dataCorreta,
                hora: pontoData.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                tip: tip,
                ori: pontoData.hora || "00:00"
            });

            // Ajustar timestamp para horário do Brasil (-3 horas)
            const agora = new Date();
            const dataProcessamento = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
            
            console.log("⏰ DEBUG - Timestamp processo:", {
                agora_servidor: agora.toISOString(),
                agora_servidor_local: agora.toLocaleString('pt-BR'),
                processo_brasil: dataProcessamento.toISOString(),
                processo_brasil_local: dataProcessamento.toLocaleString('pt-BR'),
                diferenca_horas: "-3 horas",
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            
            console.log("📅 DEBUG - Datas para salvar:", {
                dat_original: pontoData.dat,
                dat_parsed: new Date(pontoData.dat),
                data_correta: dataCorreta,
                data_correta_iso: dataCorreta.toISOString(),
                processo: dataProcessamento
            });

            // Criar o ponto na base de dados
            const novoPonto = await prismaClient.ponto_batidas.create({
                data: {
                    funcionario_id: pontoData.funcionario_id,
                    emp: pontoData.emp,
                    dat: dataCorreta, // Usar data local correta
                    hora: pontoData.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    locacao_id: pontoData.locacao_id || null,
                    origem: pontoData.origem || "mobile",
                    lat: pontoData.lat || null,
                    lng: pontoData.lng || null,
                    endereco: pontoData.endereco || null,
                    distancia_m: pontoData.distancia_m || null,
                    status: pontoData.status || "registrado",
                    justificativa: pontoData.justificativa || "",
                    processo: dataProcessamento, // Timestamp atual do servidor
                    ori: pontoData.hora || "00:00",
                    tip: tip
                }
            });

            console.log("✅ Ponto registrado com sucesso! ID:", novoPonto.id);

            return {
                success: true,
                message: "Ponto registrado com sucesso!",
                statusCode: 201,
                ponto: novoPonto
            };

        } catch (error: any) {
            console.error("❌ Erro ao registrar ponto:", error.message);
            return {
                success: false,
                message: "Erro interno do servidor ao registrar ponto.",
                statusCode: 500,
            };
            

        }
    }
}
