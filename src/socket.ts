import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // Adresse de ton serveur

export default socket;
