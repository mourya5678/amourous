"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const routes_1 = __importDefault(require("./src/config/routes"));
const socket_1 = require("./src/utils/socket");
const mysqldb_1 = require("./src/config/mysqldb");
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.static(__dirname + '/public'));
app.use('/', express_1.default.static(path_1.default.join(__dirname, 'src/uploads')));
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'src/views'));
(0, routes_1.default)(app);
app.get("/", (req, res) => {
    return res.send("Amorous Dating App Working");
});
const PORT = process.env.PORT;
const IS_LIVE = process.env.IS_LIVE === "true";
const APP_URL = process.env.APP_URL;
const EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET;
let server = null;
if (IS_LIVE) {
    const sslOptions = {
        ca: fs_1.default.readFileSync("/var/www/html/ssl/ca_bundle.crt"),
        key: fs_1.default.readFileSync("/var/www/html/ssl/private.key"),
        cert: fs_1.default.readFileSync("/var/www/html/ssl/certificate.crt"),
    };
    server = https_1.default.createServer(sslOptions, app);
    server.listen(PORT, () => {
        console.log(`Server is working on ${APP_URL}`);
    });
}
else {
    server = http_1.default.createServer(app);
    server.listen(PORT, () => {
        console.log(`Server is working on ${APP_URL}`);
    });
}
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
app.set("io", exports.io);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mysqldb_1.connectDatabase)();
    (0, socket_1.configureSocketIO)(exports.io);
}))();
