import { Router } from "express";
import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import { LoginController } from "./controllers/Users/LoginController";
import { SincronizarController } from "./controllers/Users/SincronizarController";
import { ReceberPontosController } from "./controllers/Users/ReceberPontosController";
import { EnviarPontosUsuarioController } from "./controllers/Users/EnviarPontosUsuarioController";
import { SincronizarBatidasController } from "./controllers/Users/SincronizarBatidasController";
import { ExcluirPontoController } from "./controllers/Users/ExcluirPontoController";
import { RetificarController } from "./controllers/Users/RetificarController";
import { RegistrarPontoController } from "./controllers/Users/RegistrarPontoController";
import { BuscarFuncionarioCompletoController } from "./controllers/Users/BuscarFuncionarioCompletoController";

// Importar rotas FTP
const ftpRoutes = require('./routes/ftpRoutes');

export const router = Router();

router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Servidor Ponto Digital - Micro&Money ON",
    });
});

router.get("/apiversion", (req: Request, res: Response) => {
    const apiversion = process.env.APIVersion;
    res.status(200).json({
        success: true,
        message: "Versão Atual da API: ",
        apiversion: apiversion
    });
});

router.get("/sincronizar", async (req: Request, res: Response) => {
    const controller = new SincronizarController();
    await controller.handle(req, res);
});

router.post("/sincronizarBatidas", async (req: Request, res: Response) => {
    const controller = new SincronizarBatidasController();
    await controller.handle(req, res);
});

router.post("/retificar", async (req: Request, res: Response) => {
    const controller = new RetificarController();
    await controller.handle(req, res);
});

router.post("/login", async (req: Request, res: Response) => {
    const controller = new LoginController();
    await controller.handle(req, res);
});

router.post("/receberpontos", async (req: Request, res: Response) => {
    const controller = new ReceberPontosController();
    await controller.handle(req, res);
});

router.post("/pontosdousuario", async (req: Request, res: Response) => {
    const controller = new EnviarPontosUsuarioController();
    await controller.handle(req, res);
});

router.post("/registrarponto", async (req: Request, res: Response) => {
    const controller = new RegistrarPontoController();
    await controller.handle(req, res);
});


router.delete("/excluirponto", async (req: Request, res: Response) => {
    const controller = new ExcluirPontoController();
    await controller.handle(req, res);
});

router.post("/funcionariocompleto", async (req: Request, res: Response) => {
    const controller = new BuscarFuncionarioCompletoController();
    await controller.handle(req, res);
});

// Usar as rotas FTP
router.use(ftpRoutes);
