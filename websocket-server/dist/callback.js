"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.callbackHandler = exports.isCallbackSet = void 0;
const http = __importStar(require("http"));
const number = __importStar(require("lib0/number"));
const url_1 = require("url");
const CALLBACK_URL = process.env.CALLBACK_URL
    ? new url_1.URL(process.env.CALLBACK_URL)
    : null;
const CALLBACK_TIMEOUT = number.parseInt(process.env.CALLBACK_TIMEOUT || "5000");
const CALLBACK_OBJECTS = process.env.CALLBACK_OBJECTS
    ? JSON.parse(process.env.CALLBACK_OBJECTS)
    : {};
exports.isCallbackSet = !!CALLBACK_URL;
/**
 * Handles callback for shared document updates
 * @param update - Uint8Array representing the update
 * @param origin - Origin of the update
 * @param doc - Shared document
 */
const callbackHandler = (update, origin, doc) => {
    const room = doc.name;
    const dataToSend = {
        room,
        data: {},
    };
    const sharedObjectList = Object.keys(CALLBACK_OBJECTS);
    sharedObjectList.forEach((sharedObjectName) => {
        const sharedObjectType = CALLBACK_OBJECTS[sharedObjectName];
        dataToSend.data[sharedObjectName] = {
            type: sharedObjectType,
            content: getContent(sharedObjectName, sharedObjectType, doc).toJSON(),
        };
    });
    CALLBACK_URL && callbackRequest(CALLBACK_URL, CALLBACK_TIMEOUT, dataToSend);
};
exports.callbackHandler = callbackHandler;
/**
 * Sends a callback request
 * @param url - Callback URL
 * @param timeout - Request timeout
 * @param data - Data to send
 */
const callbackRequest = (url, timeout, data) => {
    const stringifiedData = JSON.stringify(data);
    const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        timeout,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(stringifiedData),
        },
    };
    const req = http.request(options);
    req.on("timeout", () => {
        console.warn("Callback request timed out.");
        req.abort();
    });
    req.on("error", (e) => {
        console.error("Callback request error.", e);
        req.abort();
    });
    req.write(stringifiedData);
    req.end();
};
/**
 * Retrieves content from shared document based on object type
 * @param objName - Name of the shared object
 * @param objType - Type of the shared object
 * @param doc - Shared document
 * @returns Shared object content
 */
const getContent = (objName, objType, doc) => {
    switch (objType) {
        case "Array":
            return doc.getArray(objName);
        case "Map":
            return doc.getMap(objName);
        case "Text":
            return doc.getText(objName);
        case "XmlFragment":
            return doc.getXmlFragment(objName);
        case "XmlElement":
            return doc.getXmlElement(objName);
        default:
            return {};
    }
};
