import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";

import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as map from "lib0/map";
import debounce from "lodash.debounce";
import { WebSocket } from "ws";
import { IncomingMessage } from "http";

import { callbackHandler, isCallbackSet } from "./callback";

// Environment variable parsing with type safety
const CALLBACK_DEBOUNCE_WAIT = parseInt(
  process.env.CALLBACK_DEBOUNCE_WAIT || "2000"
);
const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(
  process.env.CALLBACK_DEBOUNCE_MAXWAIT || "10000"
);

// WebSocket ready states
const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2;
const wsReadyStateClosed = 3;

// Garbage collection and persistence settings
const gcEnabled = process.env.GC !== "false" && process.env.GC !== "0";
const persistenceDir = process.env.YPERSISTENCE;

// Persistence interface
interface Persistence {
  provider: any;
  bindState: (docName: string, ydoc: WSSharedDoc) => Promise<void>;
  writeState: (docName: string, ydoc: WSSharedDoc) => Promise<any>;
}

// Message type constants
const messageSync = 0;
const messageAwareness = 1;

// Type for content initializer function
type ContentInitializor = (ydoc: Y.Doc) => Promise<void>;

// Persistence management
let persistence: Persistence | null = null;

if (typeof persistenceDir === "string") {
  console.info('Persisting documents to "' + persistenceDir + '"');
  const LeveldbPersistence = require("y-leveldb").LeveldbPersistence;
  const ldb = new LeveldbPersistence(persistenceDir);

  persistence = {
    provider: ldb,
    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);
      ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
      ydoc.on("update", (update) => {
        ldb.storeUpdate(docName, update);
      });
    },
    writeState: async () => {},
  };
}

export const setPersistence = (persistence_: Persistence | null) => {
  persistence = persistence_;
};

export const getPersistence = () => persistence;

// Shared documents map
export const docs = new Map<string, WSSharedDoc>();

// Update handler
const updateHandler = (
  update: Uint8Array,
  _origin: any,
  doc: WSSharedDoc,
  _tr: any
) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));
};

// Content initializer
let contentInitializor: ContentInitializor = () => Promise.resolve();

export const setContentInitializor = (f: ContentInitializor) => {
  contentInitializor = f;
};

// WSSharedDoc class
export class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<any, Set<number>>;
  awareness: awarenessProtocol.Awareness;
  whenInitialized: Promise<void>;

  constructor(name: string, options: { gc?: boolean } = {}) {
    super({
      ...options,
      gc: options.gc ?? gcEnabled,
    });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    const awarenessChangeHandler = (
      {
        added,
        updated,
        removed,
      }: {
        added: number[];
        updated: number[];
        removed: number[];
      },
      conn: any
    ) => {
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
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);

      this.conns.forEach((_, c) => {
        send(this, c, buff);
      });
    };

    this.awareness.on("update", awarenessChangeHandler);
    this.on("update", updateHandler as any);

    if (isCallbackSet) {
      this.on(
        "update",
        debounce(callbackHandler, CALLBACK_DEBOUNCE_WAIT, {
          maxWait: CALLBACK_DEBOUNCE_MAXWAIT,
        }) as any
      );
    }

    this.whenInitialized = contentInitializor(this);
  }
}

// Get or create Y.Doc
export const getYDoc = (docname: string, gc = true): WSSharedDoc => {
  return map.setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname, { gc });

    if (persistence !== null) {
      persistence.bindState(docname, doc);
    }

    docs.set(docname, doc);
    return doc;
  });
};
// Message listener
const messageListener = (conn: any, doc: WSSharedDoc, message: Uint8Array) => {
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
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
    }
  } catch (err) {
    console.error(err);
    console.error("Document error:", err);
  }
};

// Close connection
const closeConn = (doc: WSSharedDoc, conn: any) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn)!;
    doc.conns.delete(conn);

    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );

    if (doc.conns.size === 0 && persistence !== null) {
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });
      docs.delete(doc.name);
    }
  }
  conn.close();
};

// Send message
const send = (doc: WSSharedDoc, conn: WebSocket, m: Uint8Array) => {
  if (
    conn.readyState !== wsReadyStateConnecting &&
    conn.readyState !== wsReadyStateOpen
  ) {
    closeConn(doc, conn);
  }

  try {
    conn.send(m, {}, (err) => {
      err != null && closeConn(doc, conn);
    });
  } catch (e) {
    closeConn(doc, conn);
  }
};

// Ping timeout
const pingTimeout = 30000;

// Setup WebSocket connection
export const setupWSConnection = (
  conn: WebSocket,
  req: IncomingMessage,
  { docName = (req.url || "").slice(1).split("?")[0], gc = true } = {}
) => {
  conn.binaryType = "arraybuffer";

  // Get or create doc
  const doc = getYDoc(docName, gc);
  doc.conns.set(conn, new Set());

  // Listen to messages
  conn.on("message", (message: ArrayBuffer) =>
    messageListener(conn, doc, new Uint8Array(message))
  );

  // Connection health check
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
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
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(doc, conn, encoding.toUint8Array(encoder));
    }
  }
};
