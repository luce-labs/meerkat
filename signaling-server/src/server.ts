import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

interface User {
  id: string;
  name: string;
  socketId: string;
}

interface LoginEvent {
  username: string;
}

interface OfferEvent {
  to: string;
  offer: RTCSessionDescriptionInit;
}

interface AnswerEvent {
  to: string;
  answer: RTCSessionDescriptionInit;
}

interface IceCandidateEvent {
  to: string;
  candidate: RTCIceCandidateInit;
}

interface LoginResponse {
  success: boolean;
  userId?: string;
  message?: string;
  users?: Pick<User, "id" | "name">[];
}

class SignalingServer {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private users: Map<string, User>;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.users = new Map();

    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.initializeServer();
  }

  private initializeServer() {
    try {
      this.io.on("connection", (socket: Socket) => {
        console.log("New client connected");

        this.setupLoginHandler(socket);
        this.setupOfferHandler(socket);
        this.setupAnswerHandler(socket);
        this.setupIceCandidateHandler(socket);
        this.setupDisconnectHandler(socket);
      });

      const port = process.env.PORT || 8080;
      this.server.listen(port, () => {
        console.log(`Socket.IO Signaling Server running on port ${port}`);
      });
    } catch (error) {
      console.error("Server initialization failed:", error);
    }
  }

  private setupLoginHandler(socket: Socket) {
    socket.on("login", (data: LoginEvent) => {
      const { username } = data;

      // Check if username is already taken
      const isUsernameTaken = Array.from(this.users.values()).some(
        (user) => user.name === username,
      );

      if (isUsernameTaken) {
        const response: LoginResponse = {
          success: false,
          message: "Username is already taken",
        };
        socket.emit("login", response);
        return;
      }

      // Create user entry
      const userId = uuidv4();
      const user: User = {
        id: userId,
        name: username,
        socketId: socket.id,
      };

      this.users.set(socket.id, user);

      // Send successful login response
      const response: LoginResponse = {
        success: true,
        userId,
        users: Array.from(this.users.values()).map((u) => ({
          id: u.id,
          name: u.name,
        })),
      };
      socket.emit("login", response);

      // Broadcast new user to all other clients
      socket.broadcast.emit("userJoined", user);
    });
  }

  private setupOfferHandler(socket: Socket) {
    socket.on("offer", (data: OfferEvent) => {
      const { to, offer } = data;
      const sender = this.users.get(socket.id);

      if (!sender) return;

      const recipient = Array.from(this.users.values()).find(
        (user) => user.name === to,
      );

      if (recipient) {
        this.io.to(recipient.socketId).emit("offer", {
          from: sender.name,
          offer,
        });
      }
    });
  }

  private setupAnswerHandler(socket: Socket) {
    socket.on("answer", (data: AnswerEvent) => {
      const { to, answer } = data;
      const sender = this.users.get(socket.id);

      if (!sender) return;

      const recipient = Array.from(this.users.values()).find(
        (user) => user.name === to,
      );

      if (recipient) {
        this.io.to(recipient.socketId).emit("answer", {
          from: sender.name,
          answer,
        });
      }
    });
  }

  private setupIceCandidateHandler(socket: Socket) {
    socket.on("ice-candidate", (data: IceCandidateEvent) => {
      const { to, candidate } = data;
      const sender = this.users.get(socket.id);

      if (!sender) return;

      const recipient = Array.from(this.users.values()).find(
        (user) => user.name === to,
      );

      if (recipient) {
        this.io.to(recipient.socketId).emit("ice-candidate", {
          from: sender.name,
          candidate,
        });
      }
    });
  }

  private setupDisconnectHandler(socket: Socket) {
    socket.on("disconnect", () => {
      const user = this.users.get(socket.id);

      if (user) {
        this.users.delete(socket.id);
        socket.broadcast.emit("userLeft", {
          id: user.id,
          name: user.name,
        });
      }
    });
  }
}

new SignalingServer();
