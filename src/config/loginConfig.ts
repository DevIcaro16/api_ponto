/**
 * Configuração do sistema de login
 * 
 * LOGIN_METHOD:
 * - 'traditional': Login com Empresa + Login + Senha (método atual)
 * - 'cpf': Login com CPF + Senha (novo método)
 */
export const LOGIN_CONFIG = {
    // Método de login ativo
    // Altere este valor para alternar entre os métodos
    LOGIN_METHOD: 'cpf' as 'traditional' | 'cpf',
    
    // Configurações específicas para cada método
    METHODS: {
        traditional: {
            name: 'Login Tradicional',
            description: 'Empresa + Login + Senha',
            fields: ['empresa', 'login', 'senha']
        },
        cpf: {
            name: 'Login por CPF',
            description: 'CPF + Senha',
            fields: ['cpf', 'senha']
        }
    }
};

/**
 * Função para verificar qual método de login está ativo
 */
export const getActiveLoginMethod = () => {
    return LOGIN_CONFIG.LOGIN_METHOD;
};

/**
 * Função para verificar se o método tradicional está ativo
 */
export const isTraditionalLogin = () => {
    return LOGIN_CONFIG.LOGIN_METHOD === 'traditional';
};

/**
 * Função para verificar se o método por CPF está ativo
 */
export const isCpfLogin = () => {
    return LOGIN_CONFIG.LOGIN_METHOD === 'cpf';
};

/**
 * Função para obter os campos obrigatórios do método ativo
 */
export const getRequiredFields = () => {
    return LOGIN_CONFIG.METHODS[LOGIN_CONFIG.LOGIN_METHOD].fields;
};
