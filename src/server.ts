import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { router } from "./routes";
import cors from "cors";

const app = express();

// Configurar limite para uploads de arquivos (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(router);

const corsOptions = {
    origin: '*', // Altere para o domínio do seu frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

dotenv.config();

// const port = process.env.PORT
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen(port, () => {
    console.log('Rodando na porta: ' + port);
});