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
exports.setupWSConnection = exports.getYDoc = exports.WSSharedDoc = exports.setContentInitializor = exports.docs = exports.getPersistence = exports.setPersistence = void 0;
const Y = __importStar(require("yjs"));
const syncProtocol = __importStar(require("y-protocols/sync"));
const awarenessProtocol = __importStar(require("y-protocols/awareness"));
const encoding = __importStar(require("lib0/encoding"));
const decoding = __importStar(require("lib0/decoding"));
const map = __importStar(require("lib0/map"));
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const callback_1 = require("./callback");
// Environment variable parsing with type safety
const CALLBACK_DEBOUNCE_WAIT = parseInt(process.env.CALLBACK_DEBOUNCE_WAIT || "2000");
const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT || "10000");
// WebSocket ready states
const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2;
const wsReadyStateClosed = 3;
// Garbage collection and persistence settings
const gcEnabled = process.env.GC !== "false" && process.env.GC !== "0";
const persistenceDir = process.env.YPERSISTENCE;
// Message type constants
const messageSync = 0;
const messageAwareness = 1;
// Persistence management
let persistence = null;
if (typeof persistenceDir === "string") {
    console.info('Persisting documents to "' + persistenceDir + '"');
    const LeveldbPersistence = require("y-leveldb").LeveldbPersistence;
    const ldb = new LeveldbPersistence(persistenceDir);
    persistence = {
        provider: ldb,
        bindState: (docName, ydoc) => __awaiter(void 0, void 0, void 0, function* () {
            const persistedYdoc = yield ldb.getYDoc(docName);
            const newUpdates = Y.encodeStateAsUpdate(ydoc);
            ldb.storeUpdate(docName, newUpdates);
            Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
            ydoc.on("update", (update) => {
                ldb.storeUpdate(docName, update);
            });
        }),
        writeState: () => __awaiter(void 0, void 0, void 0, function* () { }),
    };
}
const setPersistence = (persistence_) => {
    persistence = persistence_;
};
exports.setPersistence = setPersistence;
const getPersistence = () => persistence;
exports.getPersistence = getPersistence;
// Shared documents map
exports.docs = new Map();
// Update handler
const updateHandler = (update, _origin, doc, _tr) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    doc.conns.forEach((_, conn) => send(doc, conn, message));
};
// Content initializer
let contentInitializor = () => Promise.resolve();
const setContentInitializor = (f) => {
    contentInitializor = f;
};
exports.setContentInitializor = setContentInitializor;
// WSSharedDoc class
class WSSharedDoc extends Y.Doc {
    constructor(name, options = {}) {
        var _a;
        super(Object.assign(Object.assign({}, options), { gc: (_a = options.gc) !== null && _a !== void 0 ? _a : gcEnabled }));
        this.name = name;
        this.conns = new Map();
        this.awareness = new awarenessProtocol.Awareness(this);
        this.awareness.setLocalState(null);
        const awarenessChangeHandler = ({ added, updated, removed, }, conn) => {
            const changedClients = [...added, ...updated, ...removed];
            if (conn !== null) {
                const connControlledIDs = this.conns.get(conn);
                if (connControlledIDs) {
                    added.forEach((clientID) => connControlledIDs.add(clientID));
                    removed.forEach((clientID) => connControlledIDs.delete(clientID));
                }
            }
            // Broadcast awareness update
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageAwareness);
            encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients));
            const buff = encoding.toUint8Array(encoder);
            this.conns.forEach((_, c) => {
                send(this, c, buff);
            });
        };
        this.awareness.on("update", awarenessChangeHandler);
        this.on("update", updateHandler);
        if (callback_1.isCallbackSet) {
            this.on("update", (0, lodash_debounce_1.default)(callback_1.callbackHandler, CALLBACK_DEBOUNCE_WAIT, {
                maxWait: CALLBACK_DEBOUNCE_MAXWAIT,
            }));
        }
        this.whenInitialized = contentInitializor(this);
    }
}
exports.WSSharedDoc = WSSharedDoc;
// Get or create Y.Doc
const getYDoc = (docname, gc = true) => {
    return map.setIfUndefined(exports.docs, docname, () => {
        const doc = new WSSharedDoc(docname, { gc });
        if (persistence !== null) {
            persistence.bindState(docname, doc);
        }
        exports.docs.set(docname, doc);
        return doc;
    });
};
exports.getYDoc = getYDoc;
// Message listener
const messageListener = (conn, doc, message) => {
    try {
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);
        switch (messageType) {
            case messageSync:
                encoding.writeVarUint(encoder, messageSync);
                syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
                if (encoding.length(encoder) > 1) {
                    send(doc, conn, encoding.toUint8Array(encoder));
                }
                break;
            case messageAwareness:
                awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn);
                break;
        }
    }
    catch (err) {
        console.error(err);
        console.error("Document error:", err);
    }
};
// Close connection
const closeConn = (doc, conn) => {
    if (doc.conns.has(conn)) {
        const controlledIds = doc.conns.get(conn);
        doc.conns.delete(conn);
        awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
        if (doc.conns.size === 0 && persistence !== null) {
            persistence.writeState(doc.name, doc).then(() => {
                doc.destroy();
            });
            exports.docs.delete(doc.name);
        }
    }
    conn.close();
};
// Send message
const send = (doc, conn, m) => {
    if (conn.readyState !== wsReadyStateConnecting &&
        conn.readyState !== wsReadyStateOpen) {
        closeConn(doc, conn);
    }
    try {
        conn.send(m, {}, (err) => {
            err != null && closeConn(doc, conn);
        });
    }
    catch (e) {
        closeConn(doc, conn);
    }
};
// Ping timeout
const pingTimeout = 30000;
// Setup WebSocket connection
const setupWSConnection = (conn, req, { docName = (req.url || "").slice(1).split("?")[0], gc = true } = {}) => {
    conn.binaryType = "arraybuffer";
    // Get or create doc
    const doc = (0, exports.getYDoc)(docName, gc);
    doc.conns.set(conn, new Set());
    // Listen to messages
    conn.on("message", (message) => messageListener(conn, doc, new Uint8Array(message)));
    // Connection health check
    let pongReceived = true;
    const pingInterval = setInterval(() => {
        if (!pongReceived) {
            if (doc.conns.has(conn)) {
                closeConn(doc, conn);
            }
            clearInterval(pingInterval);
        }
        else if (doc.conns.has(conn)) {
            pongReceived = false;
            try {
                conn.ping();
            }
            catch (e) {
                closeConn(doc, conn);
                clearInterval(pingInterval);
            }
        }
    }, pingTimeout);
    // Connection close handlers
    conn.on("close", () => {
        closeConn(doc, conn);
        clearInterval(pingInterval);
    });
    conn.on("pong", () => {
        pongReceived = true;
    });
    // Initial sync and awareness
    {
        // Send sync step 1
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeSyncStep1(encoder, doc);
        send(doc, conn, encoding.toUint8Array(encoder));
        // Send awareness states
        const awarenessStates = doc.awareness.getStates();
        if (awarenessStates.size > 0) {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageAwareness);
            encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
            send(doc, conn, encoding.toUint8Array(encoder));
        }
    }
};
exports.setupWSConnection = setupWSConnection;
