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

const users = new Map<string, User>();

const handleLogin = (socket: Socket, io: Server) => (data: LoginEvent) => {
  const { username } = data;

  const isUsernameTaken = Array.from(users.values()).some(
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

  const userId = uuidv4();
  const user: User = {
    id: userId,
    name: username,
    socketId: socket.id,
  };

  users.set(socket.id, user);

  const response: LoginResponse = {
    success: true,
    userId,
    users: Array.from(users.values()).map((u) => ({
      id: u.id,
      name: u.name,
    })),
  };
  socket.emit("login", response);

  socket.broadcast.emit("userJoined", user);
};

const handleOffer = (socket: Socket, io: Server) => (data: OfferEvent) => {
  const { to, offer } = data;
  const sender = users.get(socket.id);

  if (!sender) return;

  const recipient = Array.from(users.values()).find((user) => user.name === to);

  if (recipient) {
    io.to(recipient.socketId).emit("offer", {
      from: sender.name,
      offer,
    });
  }
};

const handleAnswer = (socket: Socket, io: Server) => (data: AnswerEvent) => {
  const { to, answer } = data;
  const sender = users.get(socket.id);

  if (!sender) return;

  const recipient = Array.from(users.values()).find((user) => user.name === to);

  if (recipient) {
    io.to(recipient.socketId).emit("answer", {
      from: sender.name,
      answer,
    });
  }
};

const handleIceCandidate =
  (socket: Socket, io: Server) => (data: IceCandidateEvent) => {
    const { to, candidate } = data;
    const sender = users.get(socket.id);

    if (!sender) return;

    const recipient = Array.from(users.values()).find(
      (user) => user.name === to,
    );

    if (recipient) {
      io.to(recipient.socketId).emit("ice-candidate", {
        from: sender.name,
        candidate,
      });
    }
  };

const handleDisconnect = (socket: Socket) => () => {
  const user = users.get(socket.id);

  if (user) {
    users.delete(socket.id);
    socket.broadcast.emit("userLeft", {
      id: user.id,
      name: user.name,
    });
  }
};

const setupSocketHandlers = (socket: Socket, io: Server) => {
  console.log("New client connected");

  socket.on("login", handleLogin(socket, io));
  socket.on("offer", handleOffer(socket, io));
  socket.on("answer", handleAnswer(socket, io));
  socket.on("ice-candidate", handleIceCandidate(socket, io));
  socket.on("disconnect", handleDisconnect(socket));
};

const runServer = () => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => setupSocketHandlers(socket, io));

  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log(`Socket.IO Signaling Server running on port ${port}`);
  });

  return server;
};

runServer();
