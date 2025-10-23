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
Object.defineProperty(exports, "__esModule", { value: true });
exports.crudHandler = void 0;
const typeorm_1 = require("typeorm");
const crudHandler = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const repository = (0, typeorm_1.getRepository)(options.model);
    try {
        switch (options.action) {
            case "create":
                if (!options.data) {
                    throw new Error("Data is required for creation");
                }
                const newData = repository.create(options.data);
                return yield repository.save(newData);
            case "read":
                let read_data = [];
                read_data = yield repository.find({
                    where: options.conditions || {},
                    relations: options.relations || [],
                    order: options.order || { created: "DESC" },
                });
                return read_data;
            case "update":
                if (!options.conditions || !options.data) {
                    throw new Error("Conditions and data are required for update");
                }
                const toUpdate = yield repository.findOne({ where: options.conditions });
                if (!toUpdate) {
                    throw new Error("Resource not found");
                }
                repository.merge(toUpdate, options.data);
                return yield repository.save(toUpdate);
            case "delete":
                if (!options.conditions) {
                    throw new Error("Conditions are required for deletion");
                }
                const toDelete = yield repository.findOne({ where: options.conditions });
                if (!toDelete) {
                    throw new Error("Resource not found");
                }
                yield repository.remove(toDelete);
                return { message: "Resource deleted successfully" };
            default:
                throw new Error("Invalid action");
        }
    }
    catch (error) {
        console.error(`Error in ${options.action}:`, error);
        throw error;
    }
});
exports.crudHandler = crudHandler;
