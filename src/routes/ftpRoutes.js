// Rotas para upload FTP direto
const express = require('express');
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Endpoint para upload FTP direto (recebe arquivo em base64)
router.post('/upload-ftp-direct', async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    const { fileName, fileContent, mimeType, ftpConfig } = req.body;

    if (!fileName || !fileContent || !ftpConfig) {
      return res.status(400).json({ error: 'Dados incompletos para upload' });
    }
    
    if (!ftpConfig.host || !ftpConfig.username || !ftpConfig.password) {
      return res.status(400).json({ error: 'Configurações FTP inválidas' });
    }

    // Criar arquivo temporário a partir do base64
    const tempDir = path.join(__dirname, '..', 'temp');
    const tempFilePath = path.join(tempDir, fileName);
    
    // Criar diretório temp se não existir
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Escrever arquivo base64 para disco temporariamente
    fs.writeFileSync(tempFilePath, fileContent, 'base64');

    // Conectar ao servidor FTP
    await client.access({
      host: ftpConfig.host,
      port: ftpConfig.port || 21,
      user: ftpConfig.username,
      password: ftpConfig.password,
      secure: false, // Use true para FTPS
    });

    // Criar diretório remoto se não existir
    try {
      await client.ensureDir(ftpConfig.remotePath);
    } catch (dirError) {
      console.log('Erro ao criar diretório (pode já existir):', dirError.message);
    }

    // Caminho completo do arquivo no servidor FTP
    const remoteFilePath = path.posix.join(ftpConfig.remotePath, fileName);

    // Fazer upload do arquivo
    await client.uploadFrom(tempFilePath, remoteFilePath);

    // Fechar conexão FTP
    client.close();

    // Remover arquivo temporário
    fs.unlinkSync(tempFilePath);

    console.log(`✅ Upload FTP concluído: ${remoteFilePath}`);

    res.json({
      success: true,
      fileName: fileName,
      remotePath: remoteFilePath,
      uploadedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Erro no upload FTP:', error);
    
    // Fechar conexão se ainda estiver aberta
    try {
      client.close();
    } catch (e) {
      // Ignorar erro ao fechar conexão
    }

    // Remover arquivo temporário se existir
    try {
      const tempFilePath = path.join(__dirname, '..', 'temp', req.body.fileName || 'temp_file');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {
      // Ignorar erro ao remover arquivo temporário
    }

    res.status(500).json({
      error: 'Erro no upload FTP: ' + error.message,
    });
  }
});

// Endpoint para verificar se um arquivo existe no FTP
router.get('/check-ftp-file/:filename', async (req, res) => {
  const client = new ftp.Client();

  try {
    const { filename } = req.params;
    const ftpConfig = JSON.parse(req.query.ftpConfig);

    await client.access({
      host: ftpConfig.host,
      port: ftpConfig.port || 21,
      user: ftpConfig.username,
      password: ftpConfig.password,
      secure: false,
    });

    const remoteFilePath = path.posix.join(ftpConfig.remotePath, filename);
    
    try {
      const fileInfo = await client.size(remoteFilePath);
      client.close();
      
      res.json({
        exists: true,
        size: fileInfo,
        path: remoteFilePath,
      });
    } catch (error) {
      client.close();
      res.json({
        exists: false,
        error: error.message,
      });
    }

  } catch (error) {
    try {
      client.close();
    } catch (e) {
      // Ignorar erro ao fechar conexão
    }
    
    res.status(500).json({
      error: 'Erro ao verificar arquivo: ' + error.message,
    });
  }
});

module.exports = router;
