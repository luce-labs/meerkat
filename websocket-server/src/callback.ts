import * as http from "http";
import * as number from "lib0/number";
import { URL } from "url";

// Define types for improved type safety
interface CallbackObjects {
  [key: string]: string;
}

interface CallbackData {
  room: string;
  data: {
    [key: string]: {
      type: string;
      content: any;
    };
  };
}

// Import type for WSSharedDoc (assuming it's defined in utils.ts)
import { WSSharedDoc } from "./utils";

const CALLBACK_URL: URL | null = process.env.CALLBACK_URL
  ? new URL(process.env.CALLBACK_URL)
  : null;

const CALLBACK_TIMEOUT: number = number.parseInt(
  process.env.CALLBACK_TIMEOUT || "5000"
);

const CALLBACK_OBJECTS: CallbackObjects = process.env.CALLBACK_OBJECTS
  ? JSON.parse(process.env.CALLBACK_OBJECTS)
  : {};

export const isCallbackSet: boolean = !!CALLBACK_URL;

/**
 * Handles callback for shared document updates
 * @param update - Uint8Array representing the update
 * @param origin - Origin of the update
 * @param doc - Shared document
 */
export const callbackHandler = (
  update: Uint8Array,
  origin: any,
  doc: WSSharedDoc
): void => {
  const room = doc.name;
  const dataToSend: CallbackData = {
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

/**
 * Sends a callback request
 * @param url - Callback URL
 * @param timeout - Request timeout
 * @param data - Data to send
 */
const callbackRequest = (
  url: URL,
  timeout: number,
  data: CallbackData
): void => {
  const stringifiedData = JSON.stringify(data);
  const options: http.RequestOptions = {
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
const getContent = (
  objName: string,
  objType: string,
  doc: WSSharedDoc
): any => {
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
