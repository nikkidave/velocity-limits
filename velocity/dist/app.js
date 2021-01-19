"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const rl = __importStar(require("readline"));
const date_fns_1 = require("date-fns");
const readStream = fs.createReadStream('input.txt');
const writeStream = fs.createWriteStream('output.txt');
const file = rl.createInterface({
    input: readStream,
    output: writeStream,
    terminal: false,
});
const getAmount = (amountString) => {
    return parseFloat(amountString.slice(1));
};
let data = {};
const isValidLoad = (incomingLoad) => {
    const existingCustomerData = data[incomingLoad.customer_id];
    const isValidMaxPerDay = () => {
        return (existingCustomerData.every((loadData) => {
            return (existingCustomerData
                .filter((customerData) => date_fns_1.isSameDay(date_fns_1.parseISO(customerData.time), date_fns_1.parseISO(loadData.time)))
                .reduce((acc, filteredData) => {
                acc += getAmount(filteredData.load_amount);
                return acc;
            }, 0) < 5000);
        }));
    };
    const isValidMaxPerWeek = () => {
        return existingCustomerData.every((loadData) => {
            return (existingCustomerData
                .filter((customerData) => date_fns_1.isSameWeek(date_fns_1.parseISO(customerData.time), date_fns_1.parseISO(loadData.time)))
                .reduce((acc, filteredData) => {
                acc += getAmount(filteredData.load_amount);
                return acc;
            }, 0) < 20000);
        });
    };
    const isValidMaxLoads = () => {
        return existingCustomerData.every((loadData) => {
            return (existingCustomerData.filter((customerData) => date_fns_1.isSameDay(date_fns_1.parseISO(customerData.time), date_fns_1.parseISO(loadData.time))).length <= 3);
        });
    };
    return isValidMaxPerDay() && isValidMaxPerWeek() && isValidMaxLoads();
};
file.on('line', (line) => {
    const newLineData = JSON.parse(line);
    const existingCustomerData = data[newLineData.customer_id];
    if (!existingCustomerData) {
        data[newLineData.customer_id] = [newLineData];
        writeStream.write(JSON.stringify({
            id: newLineData.id,
            customer_id: newLineData.customer_id,
            accepted: isValidLoad(newLineData),
        }) + '\r\n');
    }
    else if (!existingCustomerData.some((loadData) => loadData.id === newLineData.id)) {
        data[newLineData.customer_id] = [...existingCustomerData, newLineData];
        writeStream.write(JSON.stringify({
            id: newLineData.id,
            customer_id: newLineData.customer_id,
            accepted: isValidLoad(newLineData),
        }) + '\r\n');
    }
});
